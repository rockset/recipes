## The Binary Survey

This is a demo of using Rockset to collection responses to a survey that is a list of yes/no questions.

It consists of two parts, a static web page and a set of three lambda functions.

### Deploying

To deploy the lambda to production, run:
```
cd lambda
echo 'rockset_api_key_here' > APIKEY
sls deploy -s prod
```
