import json
from botocore.vendored import requests
import os

ROCKSET_APIKEY = os.environ.get('ROCKSET_APIKEY')
QUERY_TEXT = """
WITH vehicle_incidents AS (
    SELECT
        *
    FROM
        sf_incidents TABLESAMPLE BERNOULLI(10)
    WHERE
        "Incident Subcategory" IN (
            'Motor Vehicle Theft',
            'Motor Vehicle Theft (Attempted)',
            'Larceny - Auto Parts',
            'Theft From Vehicle',
            'Larceny - From Vehicle'
        )
        AND "Report Type Description" LIKE '%Initial%'
        AND "Police District" <> 'Out of SF'
        AND PARSE_DATETIME('%Y/%m/%d %r', "Incident Datetime") > CURRENT_DATE() - INTERVAL 12 MONTH
        AND LENGTH("Latitude") > 0
        AND LENGTH("Longitude") > 0
),
spot_score AS (
    SELECT
        AVG(
            1 / (
                POW(
                    (vehicle_incidents."Latitude" :: float - :lat) * (3.1415 / 180) * 3959,
                    2
                ) + POW(
                    (
                        vehicle_incidents."Longitude" :: float - :lon
                    ) * (3.1415 / 180) * 3959,
                    2
                )
            )
        ) as "Risk Score"
    FROM
        vehicle_incidents
),
total_count AS (
    SELECT
        SUM("Count")::float "Count"
    FROM
        sf_risk_scores
),
safer_count AS (
    SELECT
        SUM(sf_risk_scores."Count")::float "Count"
    FROM
        sf_risk_scores,
        spot_score
    WHERE
        sf_risk_scores."Risk Score" < spot_score."Risk Score"
),
closest_incident AS (
    SELECT
        "Incident Description",
        "Intersection",
        "Incident Datetime",
        SQRT(POW(
            (vehicle_incidents."Latitude" :: float - :lat) * (3.1415 / 180) * 3959,
            2
        ) + POW(
            (
                vehicle_incidents."Longitude" :: float - :lon
            ) * (3.1415 / 180) * 3959,
            2
        )) "Distance"
    FROM
        vehicle_incidents
    ORDER BY
        "Distance" ASC
    LIMIT
        1
)
SELECT
    COALESCE(
        100.0 * safer_count."Count" / total_count."Count",
        0
    ) "Percentile",
    spot_score."Risk Score",
    'Closest vehicle-related incident in past year was ' || (ROUND(closest_incident."Distance" * 1000)/1000)::string || ' miles away on ' || closest_incident."Incident Datetime" || '. Happened at ' || closest_incident."Intersection" || '. ' || closest_incident."Incident Description" || '.' "Closest Incident"
FROM
    safer_count,
    total_count,
    spot_score,
    closest_incident
"""

def lambda_handler(event, context):
    if event['httpMethod'] == 'GET':
        f = open('index.html', 'r')
        return {
            'statusCode': 200,
            'body': f.read(),
            'headers': {
                'Content-Type': 'text/html',
            }
        }
    elif event['httpMethod'] == 'POST':
        res = requests.post(
            'https://api.rs2.usw2.rockset.com/v1/orgs/self/queries',
            headers={
                'Content-Type': 'application/json',
                'Authorization': 'ApiKey %s' % ROCKSET_APIKEY
            },
            data=json.dumps({
                'sql': {
                    'query': QUERY_TEXT,
                    'parameters': [
                        {
                            'name': 'lat',
                            'type': 'float',
                            'value': event['queryStringParameters']['lat']
                        },
                        {
                            'name': 'lon',
                            'type': 'float',
                            'value': event['queryStringParameters']['lon']
                        }
                    ]
                }
            })).json()
        return {
            'statusCode': 200,
            'body': json.dumps(res),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            }
        }
    else:
        return {
            'statusCode': 405,
            'body': 'method not allowed'
        }
