query1 = "SELECT * FROM vehicleinfo LIMIT 1"
query2 = """
            SELECT
                DISTINCT vehicleinfo.vehicleId,
                vehicleinfo._event_time
            FROM
                commons.vehicleinfo
            where
                vehicleinfo._event_time > CURRENT_TIMESTAMP() - SECONDS(5)
                AND ST_CONTAINS(
                        ST_GEOGFROMTEXT(
                            'POLYGON((-96 35, -98 35, -98 33, -96 33, -96 35))'
                        ),
                        ST_GEOGPOINT(
                            CAST(vehicleinfo.longitude as float),
                            CAST(vehicleinfo.latitude as float)
                        )
                    )
        """

query3 = """
            SELECT
                COUNT(DISTINCT vehicleinfo.vehicleId)
            FROM
                commons.vehicleinfo
            where
                vehicleinfo._event_time > CURRENT_TIMESTAMP() - SECONDS(5)
        """

query4 = """
    WITH vehicles_in_last_5_seconds AS (
        SELECT
            vehicleinfo.vehicleId,
            vehicleinfo._event_time,
            vehicleinfo.latitude,
                vehicleinfo.longitude
        from
            commons.vehicleinfo
        WHERE
            vehicleinfo._event_time > CURRENT_TIMESTAMP() - SECONDS(5)
        ),
        older_sample_time_for_vehicles as (
        SELECT
            MIN(vehicles_in_last_5_seconds._event_time) as min_time,
            vehicles_in_last_5_seconds.vehicleId
        FROM
            vehicles_in_last_5_seconds
        GROUP BY
            vehicles_in_last_5_seconds.vehicleId
        ),
        older_sample_location_for_vehicles AS (
        SELECT
            vehicles_in_last_5_seconds.latitude,
            vehicles_in_last_5_seconds.longitude,
            vehicles_in_last_5_seconds.vehicleId
        FROM
            older_sample_time_for_vehicles,
            vehicles_in_last_5_seconds
        where
            vehicles_in_last_5_seconds._event_time = older_sample_time_for_vehicles.min_time
            and vehicles_in_last_5_seconds.vehicleId = older_sample_time_for_vehicles.vehicleId
        ),
        latest_sample_time_for_vehicles as (
        SELECT
            MAX(vehicles_in_last_5_seconds._event_time) as max_time,
            vehicles_in_last_5_seconds.vehicleId
        FROM
            vehicles_in_last_5_seconds
        GROUP BY
            vehicles_in_last_5_seconds.vehicleId
        ),
        latest_sample_location_for_vehicles AS (
        SELECT
            vehicles_in_last_5_seconds.latitude,
            vehicles_in_last_5_seconds.longitude,
            vehicles_in_last_5_seconds.vehicleId
        FROM
            latest_sample_time_for_vehicles,
            vehicles_in_last_5_seconds
        where
            vehicles_in_last_5_seconds._event_time = latest_sample_time_for_vehicles.max_time
            and vehicles_in_last_5_seconds.vehicleId = latest_sample_time_for_vehicles.vehicleId
        ),
        distance_for_vehicles AS (
        SELECT
            ST_DISTANCE(
                ST_GEOGPOINT(
                    CAST(older_sample_location_for_vehicles.longitude AS float),
                    CAST(older_sample_location_for_vehicles.latitude AS float)
                ),
                ST_GEOGPOINT(
                    CAST(latest_sample_location_for_vehicles.longitude AS float),
                    CAST(latest_sample_location_for_vehicles.latitude AS float)
                )
            ) as distance,
            latest_sample_location_for_vehicles.vehicleId
        FROM
            latest_sample_location_for_vehicles,
            older_sample_location_for_vehicles
        WHERE
            latest_sample_location_for_vehicles.vehicleId = older_sample_location_for_vehicles.vehicleId
        )
    SELECT
    *
    from
    distance_for_vehicles
    ORDER BY
    distance_for_vehicles.distance DESC
"""

queries = {
    'q1': query1,
    'q2': query2,
    'q3': query3,
    'q4': query4 
}

api_key = "skZMJRZSXLZZj5HAdBjNxUfZbarWV5dLqfVO6U623zW5KROzfY0vNRa22ToZfRRe"

query_map = {
    'q1': 25,
    'q2': 25,
    'q3': 25,
    'q4': 25
}
