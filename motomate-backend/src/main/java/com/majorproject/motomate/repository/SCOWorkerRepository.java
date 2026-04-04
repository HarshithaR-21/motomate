package com.majorproject.motomate.repository;

import com.majorproject.motomate.model.SCOWorker;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SCOWorkerRepository extends MongoRepository<SCOWorker, String> {
    List<SCOWorker> findByServiceCenterId(String serviceCenterId);
    List<SCOWorker> findByServiceCenterIdAndActive(String serviceCenterId, boolean active);
    List<SCOWorker> findByServiceCenterIdAndAvailability(String serviceCenterId, String availability);
    List<SCOWorker> findByServiceCenterIdAndRole(String serviceCenterId, String role);
    long countByServiceCenterId(String serviceCenterId);
    long countByServiceCenterIdAndAvailability(String serviceCenterId, String availability);
}