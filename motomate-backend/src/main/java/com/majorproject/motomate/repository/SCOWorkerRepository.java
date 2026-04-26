package com.majorproject.motomate.repository;

import com.majorproject.motomate.model.SCOWorker;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SCOWorkerRepository extends MongoRepository<SCOWorker, String> {
    List<SCOWorker>     findByServiceCenterId(String serviceCenterId);
    List<SCOWorker>     findByServiceCenterIdAndActive(String serviceCenterId, boolean active);
    List<SCOWorker>     findByServiceCenterIdAndAvailability(String serviceCenterId, String availability);
    List<SCOWorker>     findByServiceCenterIdAndRole(String serviceCenterId, String role);
    long                countByServiceCenterId(String serviceCenterId);
    long                countByServiceCenterIdAndAvailability(String serviceCenterId, String availability);

    // Used by WorkerController /by-user/{userId} to resolve a logged-in
    // worker's UserModel id → their SCOWorker document
    Optional<SCOWorker> findByWorkerUserId(String workerUserId);
}