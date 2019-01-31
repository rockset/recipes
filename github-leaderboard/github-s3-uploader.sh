#!/bin/bash

# Export all environment variables
source config.env
export $(cut -d= -f1 config.env)

DATE=$MIN_DATE
MAX_DATE_VAL=`date -d"${MAX_DATE}" +%Y%m%d%H%M%S`

echo "Uploading data from $MIN_DATE to $MAX_DATE"

while :
do
   DATE_VAL=`date -d"${DATE}" +%Y%m%d%H%M%S`
   if [ $DATE_VAL -ge $MAX_DATE_VAL ]
   then
    break
   fi
   wget http://data.gharchive.org/"$DATE-"{0..23}.json.gz
   aws s3 mv . $S3_PATH --recursive --exclude "*" --include="$DATE*.json.gz"
   DATE=$(date +%Y-%m-%d -d "$DATE + 1 day")
done
