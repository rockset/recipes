"""Generate Customer Data"""

import csv
import random

from config import MIN_CUSTOMER_ID, MAX_CUSTOMER_ID

ACQUISITION_SOURCES = [
    'OrganicSearch',
    'PaidSearch',
    'Email',
    'SocialMedia',
    'Display',
    'Affiliate'
    'Referral'
]


def main():
    with open('customers.csv', 'w') as fout:
        writer = csv.DictWriter(fout, fieldnames=['CustomerID', 'AcquisitionSource'])
        writer.writeheader()
        for customer_id in range(MIN_CUSTOMER_ID, MAX_CUSTOMER_ID + 1):
            record = {
                'CustomerID': int(customer_id),
                'AcquisitionSource': random.choices(ACQUISITION_SOURCES).pop()
            }
            writer.writerow(record)


if __name__ == '__main__':
    main()
