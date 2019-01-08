from rockset import Client, Q
from lambdarest import lambda_handler
from credentials import API_KEY
import json

rs = Client(api_key=API_KEY,
            api_server='https://api.rs2.usw2.rockset.com')

def lambda_handler(event, context):
    if 'queryStringParameters' in event:
        if 'interval' in event["queryStringParameters"]:
            interval = event["queryStringParameters"]["interval"]

    res = rs.sql(Q(f'''-- unnest tweets with stock ticker symbols from the past 1 day
WITH stock_tweets AS
      (SELECT t.user.name, t.text, upper(sym.text) AS ticker
       FROM   "twitter-firehose" AS t, unnest(t.entities.symbols) AS sym
       WHERE  t.entities.symbols[1] is not null
         AND  t._event_time > current_timestamp() - INTERVAL {interval}),
-- aggregate stock ticker symbol tweet occurrences 
    top_stock_tweets AS
      (SELECT ticker, count(*) AS tweet_count
       FROM   stock_tweets
       GROUP BY ticker),
-- join stock ticker symbol in tweets with NASDAQ company list data
    stock_info_with_tweets AS 
      (SELECT top_stock_tweets.ticker, top_stock_tweets.tweet_count,
              tickers.Name, tickers.Industry, tickers.MarketCap
       FROM top_stock_tweets JOIN tickers
         ON top_stock_tweets.ticker = tickers.Symbol)

-- show top 10 most tweeted stock ticker symbols along with their company name, industry and market cap
SELECT * 
FROM   stock_info_with_tweets t
ORDER BY t.tweet_count DESC
LIMIT 10'''))


    return {
        "isBase64Encoded": False,
        "headers": {
                "Access-Control-Allow-Origin" : "*"
        },
        "statusCode": 200,
        "body": json.dumps([x for x in res])
    }

if __name__ == '__main__':
    print(lambda_handler(None, None))