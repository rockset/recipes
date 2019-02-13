import json

def handler(event, context):
    return {"statusCode": 200, "body": json.dumps({"message": "I'm an HTTP response"})}

from rockset import Client, Q

# connect securely to Rockset production API servers
client = Client(api_server='api.rs2.usw2.rockset.com',
                api_key='VzHi39c9xmPfyai0Ta3eHtdnNZCXhsjm46BeR28BC8tmBQ2j5XjTMFaYvmXCRloI')

def collections(event, context):
    all_collections = [c.name for c in client.Collection.list()]
    return {"statusCode": 200, "body": json.dumps(all_collections)}


print(collections(None, None))
