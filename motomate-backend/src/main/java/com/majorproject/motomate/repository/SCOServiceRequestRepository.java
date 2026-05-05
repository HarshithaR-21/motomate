package com.majorproject.motomate.repository;

import com.majorproject.motomate.model.SCOServiceRequest;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SCOServiceRequestRepository extends MongoRepository<SCOServiceRequest, String> {

    // ── existing methods (keep all of these) ──────────────────────────────────
    List<SCOServiceRequest> findByServiceCenterId(String serviceCenterId);
    List<SCOServiceRequest> findByServiceCenterIdAndStatus(String serviceCenterId, String status);
    long countByServiceCenterIdAndStatus(String serviceCenterId, String status);
    long countByServiceCenterId(String serviceCenterId);
    List<SCOServiceRequest> findByServiceCenterIdOrderByCreatedAtDesc(String serviceCenterId);
    List<SCOServiceRequest> findByAssignedWorkerId(String workerId);

    @Query("{ 'assignedWorkerId': ?0, 'status': ?1 }")
    List<SCOServiceRequest> findByAssignedWorkerIdAndStatus(String workerId, String status);

    long countByAssignedWorkerIdAndStatus(String workerId, String status);
    long countByAssignedWorkerId(String workerId);

    @Query("{ 'assignedWorkerId': ?0, 'status': { $nin: ['COMPLETED','CANCELLED'] } }")
    Optional<SCOServiceRequest> findCurrentJobForWorker(String workerId);

    @Query("{ 'serviceCenterId': ?0, 'status': 'PENDING', 'assignedWorkerId': null }")
    List<SCOServiceRequest> findIncomingJobsForWorker(String serviceCenterId);

    // ── NEW: rating queries ───────────────────────────────────────────────────

    /**
     * All completed requests for a worker that have been rated.
     * Used by WorkerService.getRatings() to build the ratings list.
     */
    @Query("{ 'assignedWorkerId': ?0, 'rated': true }")
    List<SCOServiceRequest> findRatedRequestsByWorkerId(String workerId);

    /** Check if a specific request has already been rated (prevents duplicates). */
    boolean existsByIdAndRatedTrue(String id);
}