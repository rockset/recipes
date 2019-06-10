#!/bin/bash

rm /iot-kafka-producer/src/main/resources/iot-kafka.properties
rm /iot-kafka-producer/Dockerfile
rm /iot-kafka-producer/entrypoint.sh
rm apache-maven-3.6.1-bin.tar.gz

echo "com.iot.app.kafka.zookeeper=${ZOOKEEPER_URL}:${ZOOKEEPER_PORT}" >> /iot-kafka-producer/src/main/resources/iot-kafka.properties
echo "com.iot.app.kafka.brokerlist=${KAFKA_URL}:${KAFKA_URL}" >> /iot-kafka-producer/src/main/resources/iot-kafka.properties
echo "com.iot.app.kafka.topic=${kAFKA_TOPICS}" >> /iot-kafka-producer/src/main/resources/iot-kafka.properties

cd /iot-kafka-producer/ && /apache-maven-3.6.1/bin/mvn package 

java -jar /iot-kafka-producer/target/iot-kafka-producer-1.0.0.jar
