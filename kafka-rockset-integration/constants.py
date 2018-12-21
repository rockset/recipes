from enum import Enum


class GraphType(Enum):
    BAR = 1
    LINE = 2
    PIE = 3


HIGHEST_SELLING_PRODUCTS = '''
SELECT Description, COUNT(InvoiceNo) as QuantitiesSold
FROM "orders" 
WHERE DATETIME(_event_time) >= PARSE_DATETIME_ISO8601('2011-01-01T00:00:00')
GROUP BY Description
ORDER By QuantitiesSold DESC
LIMIT 10
'''

MONTH_ON_MONTH_SALE = '''
WITH X AS (
    SELECT InvoiceNo, FORMAT_TIMESTAMP('%Y-%m', DATETIME(_event_time)) as Month, SUM(UnitPrice) as OrderValue
    FROM "orders"
    WHERE NOT REGEXP_LIKE(InvoiceNo, 'C.*')
    GROUP BY InvoiceNo, _event_time
    ORDER BY OrderValue DESC
)
SELECT Month, CEIL(SUM(OrderValue)) as TotalSale
FROM X
GROUP BY Month
ORDER BY Month
'''

ORDERS_BY_COUNTRIES = '''
SELECT Country, COUNT(DISTINCT InvoiceNo) as TotalOrders
FROM "orders" 
GROUP BY Country
HAVING COUNT(DISTINCT InvoiceNo) > 100
ORDER By TotalOrders DESC
'''

GRAPHS = [
    {
        'title': 'HIGHEST SELLING PRODUCTS',
        'query': HIGHEST_SELLING_PRODUCTS,
        'x_label': 'Description',
        'y_label': 'QuantitiesSold',
        'graph_type': GraphType.BAR
    },
    {
        'title': 'MONTH-ON-MONTH SALE',
        'query': MONTH_ON_MONTH_SALE,
        'x_label': 'Month',
        'y_label': 'TotalSale',
        'graph_type': GraphType.LINE
    },
    {
        'title': 'ORDERS BY COUNTRIES',
        'query': ORDERS_BY_COUNTRIES,
        'x_label': 'Country',
        'y_label': 'TotalOrders',
        'graph_type': GraphType.PIE
    }
]
