package com.majorproject.motomate.repository;

import com.majorproject.motomate.model.EVServiceRequest;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EVServiceRequestRepository extends MongoRepository<EVServiceRequest, String> {
    List<EVServiceRequest> findByCustomerIdOrderByCreatedAtDesc(String customerId);
    List<EVServiceRequest> findBySelectedWorkshopIdOrderByCreatedAtDesc(String workshopId);
    List<EVServiceRequest> findByAssignedWorkerIdOrderByCreatedAtDesc(String workerId);
    List<EVServiceRequest> findByAssignedWorkerIdAndStatus(String workerId, String status);
    List<EVServiceRequest> findBySelectedWorkshopIdAndStatus(String workshopId, String status);
    long countBySelectedWorkshopIdAndStatus(String workshopId, String status);
    long countByStatus(String status);
}