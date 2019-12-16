# author vipul

# generate 10 queries per second (number of thread = number of queries)
# desired total time , default = 10 mins

# 10 buckets per second, histogram of query latency

import argparse
import timeit
import random
import schedule
import time
import matplotlib.pyplot as plt
from rockset import Client, Q, F
from constants import *
from multiprocessing import Pool

# take inputs from user if passed
parser = argparse.ArgumentParser()
parser.add_argument("--qps", help="specify query per second, default = 20", type=int, default=20)
parser.add_argument("--totalTime", help="specify total time(in seconds) for the workload, default = 600", type=int, default=600)

args = parser.parse_args()

user_qps = args.qps
user_loadtime = args.totalTime

results = []

# rockset query API
def rockset_querymaker(query):
    # connect to Rockset

    rs = Client(api_key=rockset_api_key)
    print("query is", query)

    if query not in queries:
        print("Err!")

        return

    time = timeit.timeit(str(rs.sql(Q(queries[query]))))

    print(query, 1000 * time)

    return query, time * 1000

# process spawner
def spawn_processes(process_name, query_list):
    pool = Pool(processes=2 * user_qps)

    return pool.map(rockset_querymaker, query_list)

# Define a function for the thread
def workload_generator(qps):
    query_list = []

    for query_no, percentage in query_map.items():
        number_of_processes = int((float(qps) * float(percentage)) / float(100))

        query_list.extend([query_no] * number_of_processes)

    random.shuffle(query_list)
    
    results.append(spawn_processes(rockset_querymaker, query_list))

def main():
    if not rockset_api_key:
        print('Rockset API key is not found. Set your API key in ROCKSET_API_KEY env variable')
        return

    end_time = time.time() + user_loadtime

    schedule.every().second.do(workload_generator, qps=user_qps)

    while time.time() < end_time:
        schedule.run_pending()
        time.sleep(1)

    query_times = {}

    for query in query_map:
        query_times[query] = []

    for seconds_output in results:
        for query_response in seconds_output:
            query_times[query_response[0]].append(query_response[1])

    plt.hist(query_times['q1'], bins=10, label='q1')
    plt.hist(query_times['q2'], bins=10, label='q2')
    plt.hist(query_times['q3'], bins=10, label='q3')
    plt.hist(query_times['q4'], bins=10, label='q4')
    plt.legend(loc='upper right')
    plt.xlabel('Time in milliseconds')
    plt.ylabel('Number of Queries')
    plt.show()

if __name__=="__main__":
    main()
