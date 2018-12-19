import csv
import json

import dateparser
from kafka import KafkaProducer

from config import DATA_PATH, KAFKA_BOOTSTRAP_SERVER, LIMIT_DATA_TILL, KAFKA_TOPIC

kafka_producer = KafkaProducer(bootstrap_servers=KAFKA_BOOTSTRAP_SERVER)

LIMIT_DATA_TILL_EPOCH = int(dateparser.parse(LIMIT_DATA_TILL).timestamp())


def read_records_from_file(file_name):
    """
    Reads `file_name` and returns a iterator over the records

    :param file_name: (str) - File name to read data from
    :return: `Iterator`
    """
    with open(file_name, encoding='latin1') as fin:
        reader = csv.DictReader(fin)
        for counter, record in enumerate(reader):
            yield record


def apply_transformations(record):
    """
    Optionally perform any data transformations this can also be done using field mapping explained
    here https://docs.rockset.com/field-mapping/

    :param record: dict(str, any)
    :return: None
    """
    # In this example we don't need a product description
    record.pop('Description')

    record['Country'] = record['Country'].strip().replace(' ', '')

    # Rockset supports _event_time in seconds_since_epoch or milliseconds_since_epoch
    record['InvoiceDate'] = int(dateparser.parse(record['InvoiceDate']).timestamp())


def ingest_into_kafka(records):
    """
    Ingest `records` in Kafka

    :param records: Iterator - Iterator over records. Each record is a dict
    :return: None
    """
    for record in records:
        apply_transformations(record)

        print(json.dumps(record))

        # Produce messages asynchronously
        kafka_producer.send(KAFKA_TOPIC, str.encode(json.dumps(record)))

        if record['InvoiceDate'] > LIMIT_DATA_TILL_EPOCH:
            break


if __name__ == '__main__':
    records = read_records_from_file(DATA_PATH)
    ingest_into_kafka(records)
