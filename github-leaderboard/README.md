# Github Leaderboard

[GitHub Archive](https://github.blog/2012-05-01-data-at-github/ "GitHub Archive") is a project to record the public GitHub timeline, archive it on an hourly basis, and make it easily accessible for further analysis. The following steps will guide you to bring Github Archive data into AWS S3 and further into Rockset.

## Prerequisites
- Python 3.5+
- Python Virtual Environment (Optional)

## Steps to run
1. Clone the repository
```
git clone git@github.com:rockset/recipes.git
cd recipes/github-leaderboard/
```
2. Create and activate Python virtual environment `github-demo` and install all the Python dependencies.
```
python3 -m venv github-demo
source github-demo/bin/activate
pip install awscli rockset
```
3. Configure AWS CLI
```
aws configure
AWS Access Key ID [None]: YOUR-ACCESS-KEY
AWS Secret Access Key [None]: YOUR-SECRET-KEY
Default region name [None]: us-west-2
Default output format [None]: json
```
4. Create an S3 Bucket where the github data is temporarily stored. In this example, the name of the bucket is 'rockset-github-rank'. 
```
aws s3 mb s3://rockset-github-rank
```
5. Configure the rock CLI client with your Rockset API key.
```
rock configure --api_key <YOUR-API-KEY>
```
6. Create a Rockset Integration. We can access and ingest the data when creating a collection.
```
rock create integration "aws-rockset" --type=AWS --aws_access_key_id="YOUR-ACCESS-KEY" --aws_secret_access_key="YOUR-SECRET-KEY"
```

7. `github-s3-uploader.sh` script will bring a Github Archive data into an S3 bucket. Open config.env file in an editor and adjust the name of your bucket and dates for which you want to import data for.
```
MIN_DATE= # Start uploading data from this date
MAX_DATE= # Upload data till this date - inclusive
S3_PATH=s3://rockset-github-rank/github-data/
```

8. Run an uploader script.
```
./github-s3-uploader.sh
```

9. Create a Rockset Collection github-rank via aws-rockset integration using github-data residing in the AWS S3 bucket that you created in Step 4 earlier. If this command fails with the message "has zero s3 objects", then wait for sometime for the uploader script to start populating the S3 bucket and re-run this command.
```
rock create collection github-rank s3://rockset-github-rank/github-data --integration=aws-rockset
```

10. Console logs will show the upload progress. Also `s3://rockset-data/github-data/meta.txt` records the date till which data is uploaded.

11. As we have already created a Rockset collection, data ingest would start as soon as files are uploaded into an S3 bucket. You can monitor the data ingestion progress. **fill_progress** will reach to 1 when the data load completes. 
```
rock describe collection github
…
…
stats: {currentProgress: null, doc_count: 38463471, fill_progress: 0.354, last_queried_ms: 1548843110490,
    last_updated_ms: 1548843712954, total_size: 108532054774}
…
```
