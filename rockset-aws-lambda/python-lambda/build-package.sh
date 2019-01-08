#!/bin/bash
cd "$(dirname "$0")"

# remove old archives
rm *.zip
rm -rf package/

# create zip of our lambda function and dependencies
mkdir package
pip3 install -r requirements.txt --target package
cd ./package
zip -r9 ../function.zip .
cd ..
zip -g function.zip credentials.py
zip -g function.zip lambda_function.py
