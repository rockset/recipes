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
    events = rs.Collection.retrieve(COLLECTION_NAME)
except rockset.exception.InputError as e:
    events = rs.Collection.create(COLLECTION_NAME)

# Configs can be set in Configuration class directly or using helper utility
config.load_kube_config()

# load kubernetes client
v1 = client.CoreV1Api()
v1ext = client.ExtensionsV1beta1Api()

# Create a watcher around the stream, and then
# for each event, process the data from the event
# and send to rockset as part of the kubernetes_events collection
def watch_resource(resource):
    w = watch.Watch()
    for event in w.stream(resource):
        event_info = event['object'].to_dict()["metadata"]
        event_info['resource_type'] = event['object'].kind
        event_info['event_type'] = event['type']
        events.add_docs([event_info])

# We want to watch many different types of resources
# so we spawn a thread with a watcher for each type we
# are interested in
resources = [
    v1.list_pod_for_all_namespaces,
    v1.list_config_map_for_all_namespaces,
    v1ext.list_deployment_for_all_namespaces,
    v1ext.list_ingress_for_all_namespaces,
    v1ext.list_daemon_set_for_all_namespaces,
    v1ext.list_network_policy_for_all_namespaces,
    v1ext.list_replica_set_for_all_namespaces,
]
threads = []
# Spawn a thread for each resource we are watching
# so we can process events in parallel
for (idx, resource) in enumerate(resources):
    thread = threading.Thread(target=watch_resource, name='t'+str(idx), args=(resource,))
    threads.append(thread)

# We want the watchers to continue indefinitley, so we start them and run
# them forever
for thread in threads:
    thread.start()