package com.majorproject.motomate.repository;

import com.majorproject.motomate.model.SCOWorker;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SCOWorkerRepository extends MongoRepository<SCOWorker, String> {

    List<SCOWorker> findByServiceCenterId(String serviceCenterId);

    long countByServiceCenterId(String serviceCenterId);

    Optional<SCOWorker> findByWorkerUserId(String workerUserId);

    /**
     * Used by Haversine assignment — fetch all AVAILABLE workers
     * under a specific service center as candidates for nearest-worker selection.
     *
     * availability values: "AVAILABLE" | "BUSY" | "OFF_DUTY"
     */
    List<SCOWorker> findByServiceCenterIdAndAvailability(String serviceCenterId, String availability);

    long countByServiceCenterIdAndAvailability(String serviceCenterId, String availability);

    List<SCOWorker> findByServiceCenterIdAndAvailabilityNot(String serviceCenterId, String availability);

    List<SCOWorker> findByServiceCenterIdAndRole(String serviceCenterId, String role);

    Optional<SCOWorker> findByPhone(String phone);
}
