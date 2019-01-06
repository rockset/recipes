from rockset import Client
rs=Client() # requires an active profile in rockset credentials file

aws_integration=rs.Integration.retrieve("aws-rockset")
sources=[
    rs.Source.dynamo(
        table_name="rockset-demo",
        integration=aws_integration)]
rockset_dynamodb_demo=rs.Collection.create("rockset-dynamodb-demo", sources=sources)
