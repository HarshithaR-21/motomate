package com.majorproject.motomate.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.majorproject.motomate.model.Customer;

public interface CustomerRepository extends MongoRepository<Customer, String> {
    boolean existsByEmail(String email);
}
