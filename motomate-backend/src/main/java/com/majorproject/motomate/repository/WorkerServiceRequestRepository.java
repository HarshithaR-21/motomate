package com.majorproject.motomate.repository;

import com.majorproject.motomate.model.SCOServiceRequest;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Extended repository for worker-facing service request queries.
 * Reuses SCOServiceRequest collection.
 */
@Repository
public interface WorkerServiceRequestRepository extends MongoRepository<SCOServiceRequest, String> {

    /** Jobs assigned to this worker, filtered by status */
    List<SCOServiceRequest> findByAssignedWorkerIdAndStatus(String workerId, String status);

    /** All jobs assigned to this worker */
    List<SCOServiceRequest> findByAssignedWorkerId(String workerId);

    /** Paginated completed jobs for this worker, latest first */
    Page<SCOServiceRequest> findByAssignedWorkerIdAndStatusOrderByUpdatedAtDesc(
            String workerId, String status, Pageable pageable);

    /** History by vehicle number (partial match) */
    @Query("{ 'assignedWorkerId': ?0, 'status': 'COMPLETED', 'vehicleNumber': { $regex: ?1, $options: 'i' } }")
    Page<SCOServiceRequest> findHistoryByVehicleNumber(String workerId, String vehicleNumber, Pageable pageable);

    /** History filtered by date range */
    @Query("{ 'assignedWorkerId': ?0, 'status': 'COMPLETED', 'scheduledDate': { $gte: ?1, $lte: ?2 } }")
    Page<SCOServiceRequest> findHistoryByDateRange(String workerId, LocalDate from, LocalDate to, Pageable pageable);

    /** History filtered by vehicle number AND date range */
    @Query("{ 'assignedWorkerId': ?0, 'status': 'COMPLETED', 'vehicleNumber': { $regex: ?1, $options: 'i' }, 'scheduledDate': { $gte: ?2, $lte: ?3 } }")
    Page<SCOServiceRequest> findHistoryByVehicleAndDateRange(String workerId, String vehicleNumber, LocalDate from, LocalDate to, Pageable pageable);

    /** Counts */
    long countByAssignedWorkerIdAndStatus(String workerId, String status);

    long countByAssignedWorkerId(String workerId);

    /** Incoming: assigned but not yet accepted (status = ASSIGNED or PENDING for this worker) */
    @Query("{ 'assignedWorkerId': ?0, 'status': { $in: ['ASSIGNED', 'PENDING'] } }")
    List<SCOServiceRequest> findIncomingJobsForWorker(String workerId);

    /** One active job */
     @Query("{ 'assignedWorkerId': ?0, 'status': { $in: ['ASSIGNED','IN_PROGRESS','REACHED_CENTER','DIAGNOSING','PARTS_ORDERED','WORK_STARTED','TESTING','WAITING_PARTS'] } }")
    Optional<SCOServiceRequest> findCurrentJobForWorker(String workerId);

    /** For reassignment: find available workers in same center */
    @Query("{ 'serviceCenterId': ?0, 'assignedWorkerId': { $ne: ?1 }, 'status': { $nin: ['IN_PROGRESS', 'WAITING_PARTS'] } }")
    List<SCOServiceRequest> findReassignableCandidates(String serviceCenterId, String excludeWorkerId);
}