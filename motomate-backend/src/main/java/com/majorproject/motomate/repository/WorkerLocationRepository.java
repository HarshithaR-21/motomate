package com.majorproject.motomate.repository;

import com.majorproject.motomate.model.WorkerLocation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface WorkerLocationRepository extends MongoRepository<WorkerLocation, String> {

    /** Find by SCOWorker id */
    Optional<WorkerLocation> findByWorkerId(String workerId);

    /** All active (currently sharing) workers for a service center. */
    List<WorkerLocation> findByServiceCenterIdAndActiveTrue(String serviceCenterId);

    /** All workers for a service center (active or not) */
    List<WorkerLocation> findByServiceCenterId(String serviceCenterId);

    /**
     * Workers who sent a GPS ping after the given cutoff time.
     * Used by WorkerLocationService.getActiveWorkers() for the nearby-workers map.
     * Field name matches WorkerLocation.lastUpdatedAt (LocalDateTime).
     */
    List<WorkerLocation> findByLastUpdatedAtAfter(LocalDateTime cutoff);
}