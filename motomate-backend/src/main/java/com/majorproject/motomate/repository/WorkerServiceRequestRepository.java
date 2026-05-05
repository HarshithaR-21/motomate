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

@Repository
public interface WorkerServiceRequestRepository extends MongoRepository<SCOServiceRequest, String> {

    List<SCOServiceRequest> findByAssignedWorkerId(String workerId);

    long countByAssignedWorkerId(String workerId);

    List<SCOServiceRequest> findByServiceCenterId(String serviceCenterId);

    List<SCOServiceRequest> findByStatus(String status);

    List<SCOServiceRequest> findByServiceCenterIdAndStatus(String serviceCenterId, String status);

    List<SCOServiceRequest> findByAssignedWorkerIdAndStatus(String workerId, String status);

    long countByAssignedWorkerIdAndStatus(String workerId, String status);

    Page<SCOServiceRequest> findByAssignedWorkerIdAndStatusOrderByUpdatedAtDesc(
            String workerId, String status, Pageable pageable);

    /**
     * Returns the worker's current active job.
     */
    @Query("{ 'assignedWorkerId': ?0, 'status': { $in: ['ASSIGNED','IN_PROGRESS','REACHED_CENTER','DIAGNOSING','WORK_STARTED','TESTING'] } }")
    Optional<SCOServiceRequest> findCurrentJobForWorker(String workerId);

    /**
     * Returns all PENDING jobs for a service center (incoming jobs for workers).
     * NOTE: parameter is serviceCenterId, not workerId.
     */
    @Query("{ 'serviceCenterId': ?0, 'status': 'PENDING' }")
    List<SCOServiceRequest> findIncomingJobsForWorker(String serviceCenterId);

    /**
     * All active jobs for a service center (SCO dashboard map).
     */
    @Query("{ 'serviceCenterId': ?0, 'status': { $in: ['ASSIGNED','IN_PROGRESS','REACHED_CENTER','DIAGNOSING','WORK_STARTED','TESTING'] } }")
    List<SCOServiceRequest> findActiveJobsByServiceCenter(String serviceCenterId);

    /**
     * Job history by vehicle number and date range with pagination.
     */
    @Query("{ 'serviceCenterId': ?0, 'vehicleNumber': ?1, 'completedAt': { $gte: ?2, $lte: ?3 } }")
    Page<SCOServiceRequest> findHistoryByVehicleAndDateRange(
            String serviceCenterId, String vehicleNumber,
            LocalDate startDate, LocalDate endDate, Pageable pageable);

    /**
     * Job history by vehicle number with pagination.
     */
    Page<SCOServiceRequest> findByServiceCenterIdAndVehicleNumberOrderByCreatedAtDesc(
            String serviceCenterId, String vehicleNumber, Pageable pageable);

    default Page<SCOServiceRequest> findHistoryByVehicleNumber(
            String serviceCenterId, String vehicleNumber, Pageable pageable) {
        return findByServiceCenterIdAndVehicleNumberOrderByCreatedAtDesc(
                serviceCenterId, vehicleNumber, pageable);
    }

    /**
     * Job history by date range with pagination.
     */
    @Query("{ 'serviceCenterId': ?0, 'completedAt': { $gte: ?1, $lte: ?2 } }")
    Page<SCOServiceRequest> findHistoryByDateRange(
            String serviceCenterId, LocalDate startDate, LocalDate endDate, Pageable pageable);

    // ── NEW: rating queries ───────────────────────────────────────────────────

    /**
     * All completed requests for a worker where the customer has submitted a rating.
     * Used by WorkerService.getRatings() to build the individual reviews list.
     * Reads SCOServiceRequest.rated (boolean field added to model).
     */
    @Query("{ 'assignedWorkerId': ?0, 'rated': true }")
    List<SCOServiceRequest> findRatedRequestsByWorkerId(String workerId);
}