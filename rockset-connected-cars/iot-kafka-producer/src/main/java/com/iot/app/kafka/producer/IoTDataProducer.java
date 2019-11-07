package com.iot.app.kafka.producer;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Properties;
import java.util.Random;
import java.util.UUID;

import org.apache.log4j.Logger;

import com.iot.app.kafka.util.PropertyFileReader;
import com.iot.app.kafka.vo.IoTData;

import kafka.javaapi.producer.Producer;
import kafka.producer.KeyedMessage;
import kafka.producer.ProducerConfig;

/**
 * Multithreaded IoT data event producer class which uses Kafka producer for events. 
 * 
 * @author vipul 
 *
 */

public class IoTDataProducer {
	
	public static final Logger logger = Logger.getLogger(IoTDataProducer.class);

	public static void main(String[] args) throws Exception {
		// read config file
		Properties prop = PropertyFileReader.readPropertyFile();		
		String zookeeper = prop.getProperty("com.iot.app.kafka.zookeeper");
		String brokerList = prop.getProperty("com.iot.app.kafka.brokerlist");
		String topic = prop.getProperty("com.iot.app.kafka.topic");
		logger.info("Using Zookeeper=" + zookeeper + " ,Broker-list=" + brokerList + " and topic " + topic);

		// set producer properties
		Properties properties = new Properties();
		properties.put("zookeeper.connect", zookeeper);
		properties.put("metadata.broker.list", brokerList);
		properties.put("request.required.acks", "1");
		properties.put("serializer.class", "com.iot.app.kafka.util.IoTDataEncoder");
		// generate event
		// Vipul: Add multi threading here 
		Producer<String, IoTData> producer = new Producer<String, IoTData>(new ProducerConfig(properties));
		//RockSetDataProducer iotProducer = new RockSetDataProducer();
		//iotProducer.run(producer,topic);		
		int n = 10; // Number of threads: 1000 vehicles, 100 vehicles per thread. 
        	for (int i=0; i<n; i++) { 
            		Thread object = new Thread(new RockSetDataProducer(producer,topic)); 
            		object.start(); 
        	} 
	}


	/**
	 * Method runs in while loop and generates random IoT data in JSON with below format. 
	 * 
	 *{"vehicleId":"2962fd74-979e-4282-90ed-2c486e289137","vehicleType":"Private Car","routeId":"Route-A","longitude":"-95.34992","latitude":"33.79289","timestamp":"2019-06-05 23:59:48","speed":81.0,"fuelLevel":34.0,"tyrePressure":34.0}
	 * @throws InterruptedException 
	 * 
	 * 
	 */
}

class RockSetDataProducer extends IoTDataProducer implements Runnable {
	
	Producer<String, IoTData> producer;
	String topic;

	RockSetDataProducer(Producer<String, IoTData> workOnProducer, String workOnTopic)
    	{
        	producer = workOnProducer;
                topic = workOnTopic;
	}
  
	
	public void run () {
		try {
                        // Displaying the thread that is running 
                        logger.info ("Thread " + Thread.currentThread().getId() + " is running");
			generateIoTEvent(producer, topic);
                }
                catch (Exception e) {
                        // Throwing an exception 
                        logger.error ("Exception is caught");
                }

	}
	
	private void generateIoTEvent(Producer<String, IoTData> producer, String topic) throws InterruptedException {
		List<String> routeList = Arrays.asList(new String[]{"Route-A", "Route-B", "Route-C"});
		List<String> vehicleTypeList = Arrays.asList(new String[]{"Large Truck", "Small Truck", "Private Car", "Bus", "Cab"});
		Random rand = new Random();
		logger.info("Publishing events");
		// generate event in loop
		while (true) {
			List<IoTData> eventList = new ArrayList<IoTData>();
			for (int i = 0; i < 100; i++) {// create 100 vehicles
				String vehicleId = UUID.randomUUID().toString();
				String vehicleType = vehicleTypeList.get(rand.nextInt(5));
				String routeId = routeList.get(rand.nextInt(3));
				Date timestamp = new Date();
				double speed = rand.nextInt(100 - 20) + 20;// random speed between 20 to 100
				double fuelLevel = rand.nextInt(40 - 10) + 10;
				double tyrePressure = rand.nextInt(35-30) + 30; // random tyre pressure between 30 to 35
				for (int j = 0; j < 5; j++) {// Add 5 events for each vehicle
					String coords = getCoordinates(routeId);
					String latitude = coords.substring(0, coords.indexOf(","));
					String longitude = coords.substring(coords.indexOf(",") + 1, coords.length());
					int speedDeviation = rand.nextInt(20 + 20) - 20;
					IoTData event = new IoTData(vehicleId, vehicleType, routeId, latitude, longitude, timestamp, speed + speedDeviation , fuelLevel, tyrePressure);
					eventList.add(event);
				}
			}
			Collections.shuffle(eventList);// shuffle for random events
			for (IoTData event : eventList) {
				KeyedMessage<String, IoTData> data = new KeyedMessage<String, IoTData>(topic, event);
				producer.send(data);
				Thread.sleep(rand.nextInt(3000 - 1000) + 1000);//random delay of 1 to 3 seconds
			}
		}
	}
	
	//Method to generate random latitude and longitude for routes
	private String  getCoordinates(String routeId) {
		Random rand = new Random();
		int latPrefix = 0;
		int longPrefix = -0;
		if (routeId.equals("Route-A")) {
			latPrefix = 33;
			longPrefix = -96;
		} else if (routeId.equals("Route-B")) {
			latPrefix = 34;
			longPrefix = -97;
		} else if (routeId.equals("Route-C")) {
			latPrefix = 35;
			longPrefix = -98;
		} 
		Float lati = latPrefix + rand.nextFloat();
		Float longi = longPrefix + rand.nextFloat();
		return lati + "," + longi;
	}
}
