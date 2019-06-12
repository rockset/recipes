# author vipul

# generate 10 queries per second (number of thread = number of queries)
# desired total time , default = 10 mins

# 10 buckets per second, histogram of query latency

import argparse
import threading
import timeit
import time
import random
from rockset import Client, Q, F
from constants import *

default_qps=10
default_time=10 #mins 

# take inputs from user if passed
parser = argparse.ArgumentParser()
parser.add_argument("--qps", help="specify query per second, default = 10", type=int, default=10)
parser.add_argument("--totalTime", help="specify total time(in seconds) for the workload, default = 600", type=int, default=600)

args = parser.parse_args()

user_qps = args.qps
user_loadtime = args.totalTime


# rockset query API
def rocksetQueryMaker(query):
    # connect to Rockset
<<<<<<< HEAD
    api_key = apiKey
=======
    api_key = "lql00adPzsFovbauxl3Gj1drN9vQyPizwZXdxpTncQtqJJi68FU948pbjLj6zsoI"
>>>>>>> 722a85b250cb9aa9f24e7030dfcdbcb7dade5c47
    rs = Client(api_key=api_key)
    print("query is "+query)
    if query=="query1":
        print (timeit.timeit(str(rs.sql(Q(query1)))))
    elif query=="query4":
        print (timeit.timeit(str(rs.sql(Q(query4)))))
    elif query=="query5":
        print (timeit.timeit(str(rs.sql(Q(query5)))))
    else:
        print("Err!")


# thread spawner
def spawnThread(process_name,queryList):
    random.shuffle(queryList)
    for i in range(len(queryList)):
        t=threading.Thread(target=process_name, args=(queryList[i],))
        t.start()
        time.sleep(1)

# Define a function for the thread
def workloadGenerator(qps):
    # 5 threads of q1 if qps = 10
    # 3 threads of q2
    # 2 threads of q5
    
    numberofthread_q1 = int((float(qps)*float(50))/float(100))
    numberofthread_q4 = int((float(qps)*float(30))/float(100))
    numberofthread_q5 = int((float(qps)*float(20))/float(100))

    queryList = []

    for i in range(numberofthread_q1):
        queryList.append("query1")

    for i in range(numberofthread_q4):
        queryList.append("query4")

    for i in range(numberofthread_q5):
        queryList.append("query5")
    
    spawnThread(rocksetQueryMaker,queryList)

def main():
    endTime = time.time()+user_loadtime
    while time.time()<endTime:
    	workloadGenerator(user_qps)

if __name__=="__main__":
    main()
