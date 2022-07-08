from time import sleep
import requests, json, os, boto3
from base64 import b64decode

# Rockset API for your desired region
# Stored as a Lambda Env Variable called BASE_URL
# See this URL for API Server Addresses to use:
# https://rockset.com/docs/rest-api/#introduction
BASE_URL = os.environ["BASE_URL"]

# Rockset API Key to use for both metrics and VI switching
# Stored as an encrypted key in a Lambda Environment Variable called RKST_API_KEY
# See this URL for more details:
# https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html#configuration-envvars-encryption
API_KEY = os.environ["RKST_API_KEY"]
cipherTextBlob = b64decode(API_KEY)
DECRYPTED_API_KEY = boto3.client('kms').decrypt(CiphertextBlob=cipherTextBlob)['Plaintext']

# This array includes the approved sizes for scaling
# Available Rockset VI Sizes
# FREE, NANO, SHARED, SMALL, MEDIUM, LARGE, XLARGE, XLARGE2, XLARGE4, XLARGE8, XLARGE16
APPROVED_VI_SIZES = ['LARGE', 'XLARGE', 'XLARGE2', 'XLARGE4']

# Check the Rockset Virtual Instance for:
# - Current State
# - Current VI Size
# - Desired VI Size
# - VI ID
def vi_check():
    VI_CHECK_URL = BASE_URL + '/v1/orgs/self/virtualinstances'
    
    VI_CHECK_HEADERS = {
        'Content-Type': 'application/json',
        'Authorization': 'ApiKey ' + API_KEY
    }
    
    VI_CHECK_RESP = requests.request("GET", VI_CHECK_URL, headers = VI_CHECK_HEADERS)
    VI_CHECK_TEXT = VI_CHECK_RESP.text
    VI_CURR_STATE = json.loads(VI_CHECK_RESP.text)['data'][0]['state']
    VI_CURR_SIZE = json.loads(VI_CHECK_RESP.text)['data'][0]['current_size']
    VI_DES_SIZE = json.loads(VI_CHECK_RESP.text)['data'][0]['desired_size']
    VI_ID = json.loads(VI_CHECK_RESP.text)['data'][0]['id']
    
    return VI_CHECK_TEXT, VI_CURR_STATE, VI_CURR_SIZE, VI_DES_SIZE, VI_ID

# Check the Virtual Instance CPU metrics for usage percentage
# Initiate the VI Scaling command, assuming the CPU threshold has been exceeded for desired amount of time
def vi_switch():
    VI_CURR = vi_check()
    VI_CURR_STATE = VI_CURR[1]
    VI_CURR_SIZE = VI_CURR[2]
    VI_CHECK_RESP = VI_CURR[0]
    VI_ID = VI_CURR[4]
    
    if(VI_CURR_STATE == 'ACTIVE'):
        if(VI_CURR_SIZE == APPROVED_VI_SIZES[-1]):
            print('Virtual Instance is already at ' + APPROVED_VI_SIZES[-1])
        else:
            VI_SWITCH_URL = BASE_URL + '/v1/orgs/self/virtualinstances/' + VI_ID
            
            NEXT_VI_SIZE = APPROVED_VI_SIZES[APPROVED_VI_SIZES.index(json.loads(VI_CHECK_RESP)['data'][0]['current_size']) + 1]
            
            print("Current VI Size: " + VI_CURR_SIZE)
            print("Switching to VI Size: " + NEXT_VI_SIZE)

            VI_SWITCH_PAYLOAD = json.dumps({
                "new_size": "LARGE"
            })
            
            VI_SWITCH_HEADERS = {
                'Content-Type': 'application/json',
                'Authorization': 'ApiKey ' + API_KEY
            }

            response = requests.request("POST", VI_SWITCH_URL, headers=VI_SWITCH_HEADERS, data=VI_SWITCH_PAYLOAD)
            print(json.loads(response.text)['message'])
            POST_VI_SWITCH = vi_check()
            while(POST_VI_SWITCH[2] != NEXT_VI_SIZE):
                print("Waiting for scaling to be complete")
                print("Will check again in 10 seconds")
                sleep(10)
                POST_VI_SWITCH = vi_check()
    else:
        print("Virtual Instance is currently in state " + json.loads(VI_CHECK_RESP)['data'][0]['state'])
        print("Current Size is " + json.loads(VI_CHECK_RESP)['data'][0]['current_size'])
        print("Desired Size is " + json.loads(VI_CHECK_RESP)['data'][0]['desired_size'])

def main():

    METRICS_URL = BASE_URL + '/v1/orgs/self/metrics'
    METRICS_HEADERS = {
        'Content-Type': 'application/json'
    }
    
    METRICS_RESP = requests.request("GET", METRICS_URL, headers = METRICS_HEADERS, auth = (API_KEY, ''))
    
    # TODO: This loop needs to be rewritten to allow for a few different parts:
    #   - Leverage a state file for the code to read from and write to
    #   - Allow for user to specify the CPU threshold to look for
    #   - Allow for user to specify the length of time before initiating VI Scale Command
    for i in range(1000):
        COUNTER = 0

        for r in METRICS_RESP.text.split('\n'):
            try:
                if(r.__contains__('cpu') and r[0] != '#'):
                    rows = r.replace('{',' ')
                    row = rows.split(' ')
                    for r in row:
                        if(COUNTER >= 120):
                            print("Current CPU percentage has been above the desired threshold for more than 2 minutes")
                            print("Scaling up VI size")
                            vi_switch()
                            COUNTER = 0
                        elif(float(row[2]) >= 0.3):
                            print('CPU over 30%')
                            print(row[0] + ' ' + (float(row[2]) * 100))
                            COUNTER = COUNTER + 1
                            sleep(1)
                        else:
                            print("Virtual Instance CPU is below 30%")
            except:
                print('')

if __name__ == '__main__':
    main()
