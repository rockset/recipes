FROM java:8

#COPY target/iot-kafka-producer-1.0.0.jar /iot-kafka-producer/target/iot-kafka-producer-1.0.0.jar
COPY . /iot-kafka-producer/
COPY entrypoint.sh entrypoint.sh

RUN wget -c http://mirrors.estointernet.in/apache/maven/maven-3/3.6.1/binaries/apache-maven-3.6.1-bin.tar.gz
RUN tar xzvf apache-maven-3.6.1-bin.tar.gz

ENV KAFKA_TOPICS ${KAFKA_TOPICS}
ENV KAFKA_URL ${KAFKA_URL}
ENV KAFKA_PORT ${KAFKA_PORT}
ENV ZOOKEEPER_PORT ${ZOOKEEPER_PORT}
ENV ZOOKEEPER_URL ${ZOOKEEPER_URL}

RUN chmod +x entrypoint.sh

CMD ./entrypoint.sh
