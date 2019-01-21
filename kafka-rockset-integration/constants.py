from enum import Enum


class GraphType(Enum):
    BAR = 1
    LINE = 2
    PIE = 3


HIGHEST_SELLING_PRODUCTS = '''
SELECT Description, SUM(Quantity) as QuantitiesSold
FROM "orders" 
GROUP BY Description
ORDER By QuantitiesSold DESC
LIMIT 5;
'''

MINUTE_ON_MINUTE_SALE = '''
WITH X AS (
    SELECT InvoiceNo, FORMAT_TIMESTAMP('%H:%M', DATETIME(_event_time)) as Minute, SUM(UnitPrice) as OrderValue
    FROM "orders"
    GROUP BY InvoiceNo, _event_time
  )
  SELECT Minute, CEIL(SUM(OrderValue)) as TotalSale
  FROM X
  GROUP BY Minute
  ORDER BY Minute;
'''

ORDERS_BY_COUNTRIES = '''
SELECT Country, COUNT(DISTINCT InvoiceNo) as TotalOrders
FROM "orders" 
GROUP BY Country
ORDER By TotalOrders DESC;
'''

QUERY_SALE_BY_ACQUISITION_SOURCE = '''
SELECT C.AcquisitionSource, CEIL(SUM(O.UnitPrice)) as TotalSale
FROM customers AS C JOIN orders as O on O.CustomerID = Cast(C.CustomerID AS integer)
GROUP BY C.AcquisitionSource
ORDER BY TotalSale DESC
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
        'title': 'MINUTE-ON-MINUTE SALE',
        'query': MINUTE_ON_MINUTE_SALE,
        'x_label': 'Minute',
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

SALE_BY_ACQUISITION_SOURCE = {
    'title': 'SALE BY CUSTOMER ACQUISITION SOURCE',
    'query': QUERY_SALE_BY_ACQUISITION_SOURCE,
    'x_label': 'AcquisitionSource',
    'y_label': 'TotalSale',
    'graph_type': GraphType.PIE
}
