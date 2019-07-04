from kubernetes import client, config, watch
import threading
import rockset
import os

# Before watching events, connect to the rockset client
ROCKSET_API_KEY = os.environ['ROCKSET_API_KEY'] # replace with your API key here
COLLECTION_NAME = 'kubernetes_events'
rs = rockset.Client(api_key=ROCKSET_API_KEY)

# Fetch collection called kubernetes_events. If it does not exist, create it
try:
    collection = rs.Collection.retrieve(COLLECTION_NAME)
except rockset.exception.InputError as e:
    collection = rs.Collection.create(COLLECTION_NAME)

# Configs can be set in Configuration class directly or using helper utility
# Here, we are loading it from the default location
config.load_kube_config()

# create kubernetes API instance
v1 = client.CoreV1Api()
v1ext = client.ExtensionsV1beta1Api()


def generate_event_info(event, watch):
    # The events are structured slightly differently between 
    # batch ingest and watcher streams, so we 
    # have two cases for generating the event_info document
    if watch:
        event_info = event['object'].to_dict()["metadata"]
        event_info['resource_type'] = event['object'].kind
        event_info['event_type'] = event['type']
    else:
        event_info = event.to_dict()['metadata']
        event_info['resource_type'] = event.involved_object.kind
        event_info['event_type'] = event.type
    return event_info


# Because we get a large number of events at the start of watching 
# we batch these into several groups with max size limit_size
def batch_upload_events():
    resource_version = 0
    while True:
        limit_size = 500
        events = v1.list_event_for_all_namespaces(limit=limit_size)
        continue_tok = events.metadata._continue
        resource_version = events.metadata.resource_version
        event_docs = []
        for event in events.items:
            event_docs.append(generate_event_info(event, False))
        collection.add_docs(event_docs)
        if not continue_tok:
            break
    return resource_version

# Create a watcher around the stream, and then
# for each event, process the data from the event
# and send to rockset as part of the kubernetes_events collection
def watch_events():
    w = watch.Watch()
    resource_version = batch_upload_events()
    doc_buffer = []
    for event in w.stream(v1.list_event_for_all_namespaces, _request_timeout=60, resource_version=resource_version):
        event_info = generate_event_info(event, True)
        doc_buffer.append(event_info)
        # try to add all pending docs to the rockset collection
        # if we are successful, we can flush the buffer
        try:
            rs_info = collection.add_docs(doc_buffer)
            doc_buffer = []
        # For some reason, the rockset client failed, so we 
        # keep the doc in the buffer and try again on the next event
        except Exception as e:
            # If we fail 25 times, assume there is some kind of 
            # external issue and stop the watcher.
            if len(doc_buffer) > 25:
                break

watch_events()