package com.majorproject.motomate.repository;

import com.majorproject.motomate.model.CustomerEmergencyContacts;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerEmergencyContactsRepository extends MongoRepository<CustomerEmergencyContacts, String> {

    Optional<CustomerEmergencyContacts> findByCustomerId(String customerId);
}
