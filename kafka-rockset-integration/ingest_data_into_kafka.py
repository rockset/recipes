"""Ingest a data from file to Kafka"""

import csv
import json

import dateparser
from kafka import KafkaProducer

from config import DATA_PATH, KAFKA_BOOTSTRAP_SERVER, LIMIT_DATA_TILL, KAFKA_TOPIC


def read_records_from_file(file_name):
    """
    Read ``file_name`` and returns a ``Iterator`` over the records

    Args:
        file_name (str): File name to read data from

    Returns:
        Iterator
    """
    print('Reading data from file {}'.format(file_name))
    with open(file_name, encoding='latin1') as fin:
        reader = csv.DictReader(fin)
        for counter, record in enumerate(reader):
            yield record


def apply_transformations(record):
    """
    Perform any data transformations this can also be done using field mapping explained
    here https://docs.rockset.com/field-mapping/

    Args:
        record (dict[str, any]:

    Returns:
        None
    """
    record['Quantity'] = int(record['Quantity'])
    record['UnitPrice'] = float(record['UnitPrice'])
    record['CustomerID'] = int(record['CustomerID'])

    # Rockset supports _event_time in seconds_since_epoch or milliseconds_since_epoch
    record['InvoiceDate'] = int(dateparser.parse(record['InvoiceDate']).timestamp())


def ingest_into_kafka(records):
    """
    Ingest ``records`` in Kafka

    Args:
        records (Iterator): Iterator over records. Each record is a dict

    Returns:
        None
    """
    kafka_producer = KafkaProducer(bootstrap_servers=KAFKA_BOOTSTRAP_SERVER)
    limit_data_till_epoch = int(dateparser.parse(LIMIT_DATA_TILL).timestamp())

    print('Ingesting records into Kafka. Kafka Server {}, Topic {}'.format(
        ','.join(KAFKA_BOOTSTRAP_SERVER),
        KAFKA_TOPIC))

    count = 0
    for record in records:
        if record['CustomerID']:
            apply_transformations(record)

            kafka_producer.send(KAFKA_TOPIC, str.encode(json.dumps(record)))

            count += 1
            if count % 100 == 0:
                print('{} records ingested'.format(count))

            if record['InvoiceDate'] > limit_data_till_epoch:
                break

    print('{} records ingested'.format(count))


if __name__ == '__main__':
    records = read_records_from_file(DATA_PATH)
    ingest_into_kafka(records)
