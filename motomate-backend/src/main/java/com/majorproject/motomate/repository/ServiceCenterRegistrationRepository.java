package com.majorproject.motomate.repository;

import com.majorproject.motomate.enums.ApprovalStatus;
import com.majorproject.motomate.model.ServiceCenterRegistration;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceCenterRegistrationRepository
        extends MongoRepository<ServiceCenterRegistration, String> {

    // Used to prevent duplicate sign-ups with the same email
    boolean existsByEmail(String email);

    Optional<ServiceCenterRegistration> findByEmail(String email);

    // Will be useful when you build the Admin dashboard later
    List<ServiceCenterRegistration> findByApprovalStatus(ApprovalStatus status);

    // Find by city for admin filtering
    List<ServiceCenterRegistration> findByCityIgnoreCase(String city);
}
