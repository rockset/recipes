#!/bin/bash

# Export all environment variables
source config.env
export $(cut -d= -f1 config.env)

# Getting min date as last run max date if meta file exists
echo "Getting meta file from S3"
aws s3 cp "$S3_PATH$META_FILE" . --quiet
if [ -e $META_FILE ]
then
    META_MAX_DATE=$(cat $META_FILE | grep 'MAX_DATE' | cut -d'=' -f2)
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

echo "Uploading data from $MIN_DATE to $MAX_DATE"

while :
do
   DATE_VAL=`date -d"${DATE}" +%Y%m%d%H%M%S`
   if [ $DATE_VAL -gt $MAX_DATE_VAL ]
   then
    break
   fi
   wget -q -N http://data.gharchive.org/"$DATE-"{0..3}.json.gz
   aws s3 mv . $S3_PATH --recursive --exclude "*" --include="$DATE*.json.gz*"
   echo "Finished uploading data for $DATE"
   
   DATE=$(date +%Y-%m-%d -d "$DATE + 1 day")
   
   # Updating Max date in meta file and upload to S3
   echo "MAX_DATE=${DATE}" > $META_FILE
   aws s3 mv $META_FILE $S3_PATH

done

