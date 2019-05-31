#!/usr/bin/env python3

import json
from sseclient import SSEClient as EventSource
from rockset import Client

rs=Client()
events = rs.Collection.retrieve("events")

#subscribe to all of these streams
streams = 'recentchange,page-links-change,page-create,page-move,page-properties-change,page-delete,test,recentchange,revision-create,page-undelete'
url = 'https://stream.wikimedia.org/v2/stream/{}'.format(streams)

for event in EventSource(url):
    if event.event == 'message':
        change = json.loads(event.data)

        # add to rockset
        events.add_docs([change])
