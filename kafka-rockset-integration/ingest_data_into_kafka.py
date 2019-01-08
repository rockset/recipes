"""Ingest a data to Kafka"""

import datetime
import json
import random
import time

from kafka import KafkaProducer

from config import *

START_INVOICE_ID_FROM = 0

# Generate orders across these countries
# Duplicates are intentional to simulate non-uniform data
COUNTRIES = ['United States', 'United States', 'United States', 'China', 'China', 'India', 'India',
             'United Kingdom', 'Canada']

# List of available product database with price
# Duplicates are intentional to simulate non-uniform data
STOCK_DATA = [
    {"Description": "WHITE HANGING HEART T-LIGHT HOLDER", "UnitPrice": 2.55, "StockCode": 3001},
    {"Description": "WHITE HANGING HEART T-LIGHT HOLDER", "UnitPrice": 2.55, "StockCode": 3001},
    {"Description": "WHITE HANGING HEART T-LIGHT HOLDER", "UnitPrice": 2.55, "StockCode": 3001},
    {"Description": "WHITE METAL LANTERN", "UnitPrice": 3.39, "StockCode": 3002},
    {"Description": "WHITE METAL LANTERN", "UnitPrice": 3.39, "StockCode": 3002},
    {"Description": "WHITE METAL LANTERN", "UnitPrice": 3.39, "StockCode": 3002},
    {"Description": "CREAM CUPID HEARTS COAT HANGER", "UnitPrice": 2.75, "StockCode": 3003},
    {"Description": "CREAM CUPID HEARTS COAT HANGER", "UnitPrice": 2.75, "StockCode": 3003},
    {"Description": "KNITTED UNION FLAG HOT WATER BOTTLE", "UnitPrice": 3.39, "StockCode": 3004},
    {"Description": "KNITTED UNION FLAG HOT WATER BOTTLE", "UnitPrice": 3.39, "StockCode": 3004},
    {"Description": "RED WOOLLY HOTTIE WHITE HEART.", "UnitPrice": 3.39, "StockCode": 3005},
    {"Description": "RED WOOLLY HOTTIE WHITE HEART.", "UnitPrice": 3.39, "StockCode": 3005},
    {"Description": "SET 7 BABUSHKA NESTING BOXES", "UnitPrice": 7.65, "StockCode": 3006},
    {"Description": "GLASS STAR FROSTED T-LIGHT HOLDER", "UnitPrice": 4.25, "StockCode": 3007},
    {"Description": "HAND WARMER UNION JACK", "UnitPrice": 1.85, "StockCode": 3008},
    {"Description": "HAND WARMER RED POLKA DOT", "UnitPrice": 1.85, "StockCode": 3009},
    {"Description": "ASSORTED COLOUR BIRD ORNAMENT", "UnitPrice": 1.69, "StockCode": 3010},
    {"Description": "ASSORTED COLOUR BIRD ORNAMENT", "UnitPrice": 1.69, "StockCode": 3010},
    {"Description": "ASSORTED COLOUR BIRD ORNAMENT", "UnitPrice": 1.69, "StockCode": 3010},
    {"Description": "ASSORTED COLOUR BIRD ORNAMENT", "UnitPrice": 1.69, "StockCode": 3010},
]


def ingest_orders():
    """
    Generate orders per second based on predefined products

    Returns:
        None
    """
    kafka_producer = KafkaProducer(bootstrap_servers=KAFKA_BOOTSTRAP_SERVER)
    print('Ingesting records into Kafka. Kafka Server {}, Topic {}'.format(
        ','.join(KAFKA_BOOTSTRAP_SERVER),
        KAFKA_TOPIC))

    invoice_no = START_INVOICE_ID_FROM

    while True:

        # To generate orders or not for this second
        if random.choice([True, False]):

            # Pick no. of orders to generate per sec
            for _ in range(
                    random.randint(MIN_ORDERS_PER_SEC, MAX_ORDERS_PER_SEC)):  # Orders in a sec

                invoice_no += 1
                invoice_date = int(datetime.datetime.now().timestamp())
                country = random.choice(COUNTRIES)
                customer_id = random.randint(MIN_CUSTOMER_ID, MAX_CUSTOMER_ID)

                # No. of products to include in the order
                n_products = random.randint(MIN_PRODUCTS_PER_ORDER, MAX_PRODUCTS_PER_ORDER)

                # Pick n_products randomly from STOCK_DATA
                for product in random.sample(STOCK_DATA, n_products):  # Product Selection
                    order = {
                        "InvoiceNo": invoice_no,
                        "InvoiceDate": invoice_date,
                        "CustomerID": customer_id,
                        "Country": country,
                        "StockCode": product['StockCode'],
                        "Description": product['Description'],
                        "Quantity": random.randint(MIN_PRODUCTS_PER_ORDER, MAX_PRODUCTS_PER_ORDER),
                        "UnitPrice": product['UnitPrice'],
                    }
                    kafka_producer.send(KAFKA_TOPIC, str.encode(json.dumps(order)))
                # End Product Selection for loop

                if invoice_no % 100 == 0:
                    print('{} records ingested'.format(invoice_no))

            # Ends Orders in a sec for loop

        time.sleep(1)


def main():
    ingest_orders()


if __name__ == '__main__':
    main()
