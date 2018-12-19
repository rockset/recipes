from rockset import Client, Q, F
rs=Client() # requires an active profile in rockset credentials file

aws_integration=rs.Integration.retrieve('aws_key_haneesh')
sources=[
    rs.Source.kinesis(
        stream_name="twitter-stream",
        integration=aws_integration)]
twitter_kinesis_demo=rs.Collection.create("twitter-kinesis-demo", sources=sources)
