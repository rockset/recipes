import boto3

kinesis = boto3.client('kinesis') # requires AWS credentials to be present in env
kinesis.create_stream(StreamName='twitter-stream', ShardCount=5)
