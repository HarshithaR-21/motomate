package com.majorproject.motomate;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@SpringBootApplication
@EnableMongoRepositories(basePackages = "com.majorproject.motomate.repository")
public class MotomateApplication {

	public static void main(String[] args) {
		SpringApplication.run(MotomateApplication.class, args);
	}

}
