## Mock Rental Data

These files contain fake data for creating a realistic DynamoDB table. 

The CSV files comprise [sample data from Airbnb](https://www.kaggle.com/airbnb/seattle) and [mock data from Mockaroo](https://mockaroo.com/). The JSON file is the resulting fake dataset.

To re-generate `data.json`, run:
```
python3 create_data.py
```

To load this data into DynamoDB, run:
```
python3 load_data.py
```
