package com.majorproject.motomate.repository;

import com.majorproject.motomate.model.SCOServiceRequest;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SCOServiceRequestRepository extends MongoRepository<SCOServiceRequest, String> {
    List<SCOServiceRequest> findByServiceCenterId(String serviceCenterId);
    List<SCOServiceRequest> findByServiceCenterIdAndStatus(String serviceCenterId, String status);
    long countByServiceCenterIdAndStatus(String serviceCenterId, String status);
    long countByServiceCenterId(String serviceCenterId);
    List<SCOServiceRequest> findByServiceCenterIdOrderByCreatedAtDesc(String serviceCenterId);
    List<SCOServiceRequest> findByAssignedWorkerId(String workerId);
}