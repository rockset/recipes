# This script should run in the background (python3 rockkube.py &). It watches your kubernetes events,
# and then deposits all events and associated resources into a set of rockset collections 
# These collections are prefixed with rockkube_*” followed by "events" or the name of the resource.
# You can make SQL queries by using the rockset api documented at https://docs.rockset.com or 
# https://console.rockset.com. You can also set the colletion retention by changing 
# the THIRTY_DAYS variable to a different amount. You can also set the max failures before
# giving up the script as a command line argument. (python3 rockkube.py -max_failures=5)
from kubernetes import client, config, watch
import rockset
import os
import argparse
import time

# Before watching events, connect to the rockset client
try:
    ROCKSET_API_KEY = os.environ['ROCKSET_API_KEY'] # replace with your API key here
except KeyError:
    print("""\n\nROCKSET_API_KEY is not defined. You can get an api key by visiting
https://www.rockset.com and signing up for a rockset account\n\n""")
rs = rockset.Client(api_key=ROCKSET_API_KEY)

THIRTY_DAYS = 30*24*60*60

resource_to_collection = {}
resource_to_function = {}

# Configs can be set in Configuration class directly or using helper utility
# Here, we are loading it from the default location
config.load_kube_config()

# create kubernetes API instance
v1 = client.CoreV1Api()
v1ext = client.ExtensionsV1beta1Api()

# initalize resource to function dict for resource info retrieval. 
resource_to_function['Pod'] = v1.read_namespaced_pod
resource_to_function['Deployment'] = v1ext.read_namespaced_deployment
resource_to_function['Service'] = v1.read_namespaced_service
resource_to_function['ReplicaSet'] = v1ext.read_namespaced_replica_set
resource_to_function['DaemonSet'] = v1ext.read_namespaced_daemon_set
resource_to_function['Endpoints'] = v1.read_namespaced_endpoints


def generate_event_info(event, watch):
    # The events are structured slightly differently between 
    # batch ingest and watcher streams, so we 
    # have two cases for generating the event_info document
    if watch:
        event_info = event
    else:
        event_info = event.to_dict()
    return event_info


def add_docs_to_rockset(collection_prefix, docs):
    collection_name = 'rockkube_' + collection_prefix.lower() + 's'
    collection_created = True
    if collection_name not in resource_to_collection:
        # Fetch collection. If it does not exist, create it
        try:
            resource_to_collection[collection_name] = rs.Collection.retrieve(collection_name)
        except Exception as e:
            collection_created = False
            resource_to_collection[collection_name] = rs.Collection.create(collection_name, retention_secs=THIRTY_DAYS)
    # Wait for the collection to be created before uploading, or we get a 503
    if not collection_created:
        time.sleep(5)
    resource_to_collection[collection_name].add_docs(docs)

# Because we get a large number of events at the start of watching 
# We batch these into several groups with max size limit_size
# This function returns the resource version, which is the number before which
# our watcher does not return events. This prevents us from getting 
# duplicates when we stream the events for all namespaces
def batch_upload_events(max_failures):
    resource_version = 0
    continue_tok = ''
    while True:
        limit_size = 500
        events = v1.list_event_for_all_namespaces(limit=limit_size, _continue = continue_tok)
        continue_tok = events.metadata._continue
        resource_version = events.metadata.resource_version
        event_docs = []
        for event in events.items:
            event_info = generate_event_info(event, False)
            event_docs.append(event_info)
            add_resource_info_to_collection(event_info)
        add_docs_to_rockset('Event', event_docs)
        # scaled backoff for uploading to rockset
        num_tries = 0
        backoff_factor = 5
        for _ in range(max_failures):
            try:
                # try a timed backoff on uploading events 
                time.sleep(num_tries * backoff_factor)
                add_docs_to_rockset('Event', event_docs)
                break
            except Exception:
                num_tries += 1
        if num_tries == max_failures:
            raise Exception("Uploading events to Rockset failed {} times in a row. Please try agian later".format(num_tries))
        if not continue_tok:
            break
    return resource_version

# Get information about an associated resource for an event
# and upload to respective rockset collection
def add_resource_info_to_collection(event_info):
    if "involved_object" in event_info:
        obj = event_info["involved_object"]
    else:
        obj = event_info["object"].to_dict()
    if "namespace" not in obj or "name" not in obj:
        return
    namespace = obj["namespace"]
    name = obj["name"]
    try:
        resource_type = obj["kind"]
        # We only care about retreiving a specific subset 
        # of resource types
        if resource_type not in resource_to_function:
            return
        get_function = resource_to_function[resource_type]
        resource_info = get_function(namespace=namespace, name=name).to_dict()
        add_docs_to_rockset(resource_type, [resource_info])
    # There is a 404 error here where the pod is sometimes not found
    # we ignore this error as it happens with enough frequency not to warrant failover
    except Exception as e:
        pass

# Create a watcher around the stream, and then
# for each event, process the data from the event
# and send to rockset as part of the rockkube_events collection
def watch_events(max_failures):
    w = watch.Watch()
    resource_version = batch_upload_events(max_failures)
    doc_buffer = []
    consecutive_failures = 0
    # Here, resource version allows us to not fetch a large batch of events
    for event in w.stream(v1.list_event_for_all_namespaces, resource_version=resource_version):
        event_info = generate_event_info(event, True)
        add_resource_info_to_collection(event_info)
        doc_buffer.append(event_info)
        # try to add all pending docs to the rockset collection
        # if we are successful, we can flush the buffer and reset fail count
        try:
            # TODO: save resource version here so we don't duplicate updates - need to be careful about this when we re-start
            add_docs_to_rockset('Event', doc_buffer)
            doc_buffer = []
            consecutive_failures = 0
        # For some reason, the rockset client failed, so we 
        # keep the doc in the buffer and try again on the next event
        except Exception as e:
            consecutive_failures += 1
            print("Failed uploading to Rockset {} consecutive times".format(consecutive_failures, max_failures))
            # If we fail MAX_FAILURES times, assume there is some kind of 
            # external issue and stop the watcher.
            if len(doc_buffer) > max_failures:
                print("ERROR: Failed to upload to rockset {} times in a row. Terminating watcher.".format(max_failures))
                break


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("-max_failures", nargs='?', default=10)
    args = parser.parse_args()
    watch_events(int(args.max_failures))
