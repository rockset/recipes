# Rockset + AWS Lambda

## Prerequisites

* This guide assumes that you are familiar with [AWS Lambda](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html).
* The instructions below require Python3.7 or higher for installation.
* Please read the blog post on rockset.com for instructions 
  and details on using this example.

## Installation

1. Clone this repository.
1. Enter the **rockset-aws-lambda/python-lambda** directory, open `credentials.py` and fill in your
   Rockset `API_KEY`.
1. Run the `build-package.sh` script from that directory. This script downloads
   the dependencies and packages it up into a functions.zip file. This is the zip that we
   will upload to AWS Lambda
1. Create an AWS Lambda function. You can do this using the below command.
   You will need to create/use the appropriate role in the command. See [lambda roles](https://docs.aws.amazon.com/lambda/latest/dg/intro-permission-model.html#lambda-intro-execution-role) for details.

```bash
aws lambda create-function \
    --function-name my-function \
    --runtime=python3.7 \
    --role=<specify-role-here> \
    --handler=lambda_function.lambda_handler \
    --zip-file fileb://function.zip
```

## API Gateway

You can set up API Gateway to serve the lambda once it has been uploaded.
Detailed instructions can be found in the [create an API with the Lambda Custom Integration](https://docs.aws.amazon.com/apigateway/latest/developerguide/getting-started-lambda-non-proxy-integration.html#getting-started-new-api) tutorial.

## Client Setup

1. Once the API Gateway and endpoint is set up and operational, you can use it within the sample web application.
1. Open **rockset-aws-lambda/js-app/assets/js/script.js**.
1. Fill in the `LAMBDA_URL` field within the JS file with the API endpoint URL.
1. Run a [local Python HTTP server](https://developer.mozilla.org/en-US/docs/Learn/Common_questions/set_up_a_local_testing_server#Running_a_simple_local_HTTP_server) and serve index.html to run the webpage.

## Updating the lambda

If you're experimenting and iterating on the lambda function by changing the query,
you can update the lambda using the below command.

```bash
aws lambda update-function-code \
    --function-name my-function \
    --zip-file fileb://function.zip
```