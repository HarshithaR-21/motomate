package com.majorproject.motomate.repository;

import com.majorproject.motomate.model.CustomerServiceModel;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomerServiceRepository extends MongoRepository<CustomerServiceModel, String> {
    // That's it! MongoRepository provides save(), findAll(), findById(), deleteById() automatically
}