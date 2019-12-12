query1 = """
            /* Check whether a vehicle has moved in last 5 seconds */

            SELECT
                COUNT(
                    DISTINCT ST_GEOGPOINT(
                        CAST(vehicleinfo.longitude AS float),
                        CAST(vehicleinfo.latitude AS float)
                    )
                )
            FROM
                commons.vehicleinfo
            WHERE
                vehicleinfo._event_time > CURRENT_TIMESTAMP() - SECONDS(5)
                AND vehicleinfo.vehicleId = '417daf89-892c-414a-9ae5-5f4c231c8996'
        """
query2 = """
            /* Get the number of vehicles that are in a given region in last 5 seconds */

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

query4 = """
            /* Get the number of sensor metric events produced in last 5 seconds */

            SELECT
                COUNT(DISTINCT vehicleinfo.vehicleId)
            FROM
                commons.vehicleinfo
            where
                vehicleinfo._event_time > CURRENT_TIMESTAMP() - SECONDS(5)
        """

query3 = """
    /* Get the vehicles which have moved largest distance in last 5 seconds */

    /* Getting events in last 5 seconds */
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

        /* Getting the oldest event time for each vehicle in last 5 seconds */ 
        older_sample_time_for_vehicles as (
        SELECT
            MIN(vehicles_in_last_5_seconds._event_time) as min_time,
            vehicles_in_last_5_seconds.vehicleId
        FROM
            vehicles_in_last_5_seconds
        GROUP BY
            vehicles_in_last_5_seconds.vehicleId
        ),

        /* Getting the location of the vehicle at its oldest time for each vehicle */
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

        /* Getting the latest event time for each vehicle in last 5 seconds */
        latest_sample_time_for_vehicles as (
        SELECT
            MAX(vehicles_in_last_5_seconds._event_time) as max_time,
            vehicles_in_last_5_seconds.vehicleId
        FROM
            vehicles_in_last_5_seconds
        GROUP BY
            vehicles_in_last_5_seconds.vehicleId
        ),

        /* Getting the location of the vehicle at its latest time for each vehicle */
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

        /* Getting the distance covered by each vehicle using the latest and oldest locations */
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

rockset_api_key = "<rockset_api_key>"

query_map = {
    'q1': 50,
    'q2': 40,
    'q3': 5,
    'q4': 5
}
