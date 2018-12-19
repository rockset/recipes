# twitter api credentials
access_token=""
access_token_secret=""
consumer_key=""
consumer_secret=""

class TweetListener(StreamListener):
    def __init__(self, stream_name):
        self.kinesis = boto3.client('kinesis')
        self.stream_name = stream_name

    def on_data(self, data):
        record = {}
        record['Data'] = data
        record['PartitionKey'] = ''.join(random.choice(chars) for _ in range(size))
        self.kinesis.put_records(Records=[record], StreamName=self.stream_name)

auth=OAuthHandler(consumer_key, consumer_secret)
auth.set_access_token(access_token, access_token_secret)

stream=Stream(auth, TweetListener("twitter-stream"))
search_terms=["music", "facebook", "apple"]
stream.filter(track=search_terms)
