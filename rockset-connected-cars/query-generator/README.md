## Query Generator

This is a small script for load testing your Rockset collection with your queries.

### Configuration

Put your Rockset API key in the `rockset_api_key` in the `constants.py`. After that run the query-generator with the following:

`python query-generator.py --totalTime 20 --qps 20`

With the above arguments, query generator will run for 20 seconds(totalTime) while firing 20 queries each second(qps).
Number of different queries and queries themselves are configurable from the `constants.py`.

The `query_map` defines the weight of queries. Each query has a percentage number on the basis of which the query_generator will make a mix with that number of queries. By default, this contains 4 queries but any number of queries can be added.

`api_key` can be changed to use your own collection.

### How to run

If you have `pipenv` installed then you can just do: `pipenv shell && pipenv install`

There is also a `requirements.txt` so you can also do: `pip install -r requirements.txt`

then the above command to run the generator.