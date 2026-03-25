package com.majorproject.motomate.repository;

import com.majorproject.motomate.enums.ApprovalStatus;
import com.majorproject.motomate.model.FleetManagerRegistration;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FleetManagerRegistrationRepository
        extends MongoRepository<FleetManagerRegistration, String> {

    boolean existsByEmail(String email);

    Optional<FleetManagerRegistration> findByEmail(String email);

    // Ready for Admin dashboard filtering
    List<FleetManagerRegistration> findByApprovalStatus(ApprovalStatus status);

    List<FleetManagerRegistration> findByCityIgnoreCase(String city);

    List<FleetManagerRegistration> findByIndustryTypeIgnoreCase(String industryType);
}
