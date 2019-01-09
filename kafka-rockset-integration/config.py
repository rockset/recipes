# Kafka Configuration
KAFKA_TOPIC = 'orders'
KAFKA_BOOTSTRAP_SERVER = ['localhost:9092']

# Rockset Configuration - # Create API Key - https://console.rockset.com/manage/apikeys
ROCKSET_API_KEY = ''
ROCKSET_API_SERVER = 'https://api.rs2.usw2.rockset.com'

# Simulating 500 customers
MIN_CUSTOMER_ID = 10000
MAX_CUSTOMER_ID = 10500

# Control no. of products to include per order
MIN_PRODUCTS_PER_ORDER = 1
MAX_PRODUCTS_PER_ORDER = 10

# Control no. of products to include per order
MIN_QUANTITY_PER_PRODUCT = 1
MAX_QUANTITY_PER_PRODUCT = 3

# Control no. of orders per second
MIN_ORDERS_PER_SEC = 1
MAX_ORDERS_PER_SEC = 300
