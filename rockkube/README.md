## Introduction

rockkube is an utility that watches for config changes in your kubernetes cluster and inserts them into your Rockset collections. And then you can immeditely make SQL queries on that data by via a webUI at  https://console.rockset.com/login or via a command line interface at https://docs.rockset.com/rockset-cli/.

## Setup
`$ pip3 install -r requirements.txt`

Please set your Rockset API key as an enviornment variable named ROCKSET_API_KEY. If you do not have a Rockset API key, you can fetch it by creating a Rockset account at http://rockset.com

`$ export ROCKSET_API_KEY='my_api_key'`

## Running rockkube
`$ python3 rockkube.py`

## Running with a different failover count
`$ python3 rockkube.py -max_failures=5`
