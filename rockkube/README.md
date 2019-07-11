## Setup
`$ pip3 install -r requirements.txt`

Make sure you have the Rockset API key as an
enviornment variable

`$ export ROCKSET_API_KEY='my_api_key'`

## Running rockkube
`$ python3 rockkube.py`

## Running with a different failover count
`$ python3 rockkube.py -max_failures=5`
