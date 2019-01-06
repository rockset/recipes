import boto3
dynamodb = boto3.resource('dynamodb', region_name='us-west-2',
                endpoint_url="https://dynamodb.us-west-2.amazonaws.com",)
table = dynamodb.create_table(
    TableName='rockset-demo',
    KeySchema=[
        {
            'AttributeName': 'id',
            'KeyType': 'HASH'
        }
    ],
    AttributeDefinitions=[
        {
            'AttributeName': 'id',
            'AttributeType': 'N'
        }
    ],
    ProvisionedThroughput={
        'ReadCapacityUnits': 5,
        'WriteCapacityUnits': 5
    }
)
