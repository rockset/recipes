FROM java:8

COPY target/iot-kafka-producer-1.0.0.jar iot-kafka-producer-1.0.0.jar
COPY iot-kafka-producer.env iot-kafka-producer.env
COPY entrypoint.sh entrypoint.sh

ENV KAFKA_TOPICS ${KAFKA_TOPICS}
ENV KAFKA_URL ${KAFKA_URL}
ENV KAFKA_PORT ${KAFKA_PORT}
ENV ZOOKEEPER_PORT ${ZOOKEEPER_PORT}
ENV ZOOKEEPER_URL ${ZOOKEEPER_URL}

RUN chmod +x entrypoint.sh

CMD ./entrypoint.sh
