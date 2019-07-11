## Setup
`pip3 install -r requirements.txt`

## Running rockkube
`python3 rockkube`


Note: Make sure you have the Rockset API key as an
enviornment variable!

`export ROCKSET_API_KEY='my_api_key'`

## Running with a different failover count
`python3 rockkube -max_failures=5`