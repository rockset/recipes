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
python3 -m virtualenv github-demo
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
4. Configure AWS CLI
```
aws configure
AWS Access Key ID [None]: YOUR-ACCESS-KEY
AWS Secret Access Key [None]: YOUR-SECRET-KEY
Default region name [None]: us-west-2
Default output format [None]: json
```
5. Create an S3 Bucket rockset-data
```
aws s3api create-bucket --bucket rockset-data
```
6. Configure the rock CLI client with your Rockset API key.
```
rock configure --api_key <YOUR-API-KEY>
```
7. Create a Rockset Integration. We can access and ingest the data when creating a collection.
```
rock create integration "aws-rockset" --type=AWS --aws_access_key_id="YOUR-ACCESS-KEY" --aws_secret_access_key="YOUR-SECRET-KEY"
```
8. Create a Rockset Collection github via aws-rockset integration using github-data residing in AWS S3 bucket.
```
rock create collection github s3://rockset-data/github-data --integration=aws-rockset
```
9. `github-s3-uploader.sh` script will bring a Github Archive data into an S3 bucket. Open config.env file in an editor and adjust the dates for which you want to import data for.
```
MIN_DATE= # Start uploading data from this date
MAX_DATE= # Upload data till this date - inclusive
S3_PATH=s3://rockset-data/github-data/
```
10. Run an uploader script.
```
./github-s3-uploader.sh
```
11. Console logs will show the upload progress. Also `s3://rockset-data/github-data/meta.txt` records the date till which data is uploaded.

12. As we have already created a Rockset collection, data ingest would start as soon as files are uploaded into an S3 bucket. You can monitor the data ingestion progress. **fill_progress** will reach to 1 when the data load completes. 
```
rock describe collection github
…
…
stats: {currentProgress: null, doc_count: 38463471, fill_progress: 0.354, last_queried_ms: 1548843110490,
    last_updated_ms: 1548843712954, total_size: 108532054774}
…
```
