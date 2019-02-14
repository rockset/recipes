#!/bin/bash

# Export all environment variables
source config.env

# Get rid of local meta file, if it exists.
rm -rf ${META_FILE}

# Getting min date as last run max date if meta file exists
echo "Getting meta file from S3"
aws s3 cp "$S3_PATH$META_FILE" . --quiet

HOUR=0
if [ -e $META_FILE ]
then
    META_MAX_DATE=$(cat $META_FILE | grep 'MAX_DATE' | cut -d'=' -f2)
    HOUR=$(cat $META_FILE | grep 'MAX_HOUR' | cut -d'=' -f2)
    META_MAX_DATE_VAL=`date -d"${META_MAX_DATE}" +%Y%m%d%H%M%S`
    MIN_DATE_VAL=`date -d"${MIN_DATE}" +%Y%m%d%H%M%S`
    if [ $META_MAX_DATE_VAL -gt $MIN_DATE_VAL ]
    then
        MIN_DATE=$META_MAX_DATE
    	echo "Resuming data upload from date $MIN_DATE"
    fi
fi

DATE=$MIN_DATE
MAX_DATE_VAL=`date -d"${MAX_DATE}" +%Y%m%d%H%M%S`

#
# Keep tailing as long as we can find new data.
do_tail() {
    echo "Uploading data from $MIN_DATE to $MAX_DATE"
    while :
    do
       DATE_VAL=`date -d"${DATE}" +%Y%m%d%H%M%S`
       if [ $DATE_VAL -gt $MAX_DATE_VAL ]
       then
           break
       fi
       TODATE_VAL=`date +%Y%m%d`000000

       if [ $DATE_VAL -ge $TODATE_VAL ]
       then
           break
       fi

       while [[ $HOUR -le 23 ]]
       do
            wget -q -N http://data.gharchive.org/"$DATE-$HOUR".json.gz
            if [ $? -ne 0 ]
            then
                # if we could not find the file and we are trying to find a
                # future file, then return.
                if [ $DATE_VAL -ge $TODATE_VAL ]
                then
                    echo "Processed all files till ${DATE_VAL}"
                    return # no more file available
                fi
                # we could not find a file for a specific day.
                # skip and continue.
                echo "Skipping file for ${DATE_VAL}"
                DATE=$(date +%Y-%m-%d -d "$DATE + 1 day")
            fi

            aws s3 mv . $S3_PATH --recursive --exclude "*" --include="$DATE-$HOUR.json.gz*"
            echo "Finished uploading data for $DATE-$HOUR"

            # Updating Max date in meta file and upload to S3
            echo -e "MAX_DATE=${DATE}\r\nMAX_HOUR=$HOUR\r" > $META_FILE
            aws s3 mv $META_FILE $S3_PATH

            ((HOUR = HOUR + 1))
       done
       # set hour back to 0
       HOUR=0

       echo "Finished uploading data for $DATE"
       DATE=$(date +%Y-%m-%d -d "$DATE + 1 day")

       rm -rf ${META_FILE}
    done
}

# keep trying to fetch new data
while :
do
    do_tail
    sleep 100
done