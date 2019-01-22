import boto3
import json

dynamodb = boto3.resource('dynamodb', region_name='us-west-2', endpoint_url="https://dynamodb.us-west-2.amazonaws.com")

table = dynamodb.Table('rockset-demo')
with open("dataset/hn_comments") as json_file:
    comments = json.load(json_file)
    for comment in comments:
        cid = comment['id']
        by = comment['by'] if comment['by'] else None
        time = comment['time'] if comment['time'] else None
        score = comment['score'] if comment['score'] else None
        title = comment['title'] if comment['title'] else None
        dead = comment['dead'] if comment['dead'] else None
        deleted = comment['deleted'] if comment['deleted'] else None
        descendants = comment['descendants'] if comment['descendants'] else None
        parent = comment['parent'] if comment['parent'] else None
        text = comment['text'] if comment['text'] else None
        ctype = comment['type'] if comment['type'] else None
        url = comment['url'] if comment['url'] else None
        table.put_item(
           Item={
               'id': cid,
               'by': by,
               'time': time,
               'title': title,
               'dead': dead,
               'deleted': deleted,
               'descendants': descendants,
               'parent': parent,
               'text': text,
               'type': ctype,
               'url': url,
               'score': score
           }
        )
