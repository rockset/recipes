import boto3
import json

dynamodb = boto3.resource('dynamodb', region_name='us-west-2', endpoint_url="https://dynamodb.us-west-2.amazonaws.com")

table = dynamodb.Table('rockset-demo')
with open("dataset/hn_comments") as json_file:
    comments = json.load(json_file)
    for comment in comments:
        cid = int(comment['id'])
        body = comment['body'] if comment['body'] else None
        retrieved_at_ts = comment['retrieved_at_ts'] if comment['retrieved_at_ts'] else None
        source = comment['source'] if comment['source'] else None
        table.put_item(
           Item={
               'id': cid,
               'body': body,
               'retrieved_at_ts': retrieved_at_ts,
	       'source': source
            }
        )
