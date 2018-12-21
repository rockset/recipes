# Data Source
LIMIT_DATA_TILL = '2015-12-31 23:59:59'  # Ingest data from "2010-01-01 00:00:00" to this timestamp
DATA_PATH = './data/data.csv'  # Location of dataset

# Kafka Configuration
KAFKA_TOPIC = 'orders'
KAFKA_BOOTSTRAP_SERVER = ['localhost:9092']

# Rockset Configuration - # Create API Key - https://console.rockset.com/manage/apikeys
ROCKSET_API_KEY = ''
ROCKSET_API_SERVER = 'https://api.rs2.usw2.rockset.com'
