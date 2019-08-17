import boto3
import json

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('rental_data')

with open('data.json') as f:
    data = json.loads(f.read())

for user in data:
    try:
        table.put_item(Item=user)
    except:
        print('skipping one item.')

