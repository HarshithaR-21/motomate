package com.majorproject.motomate.service;

import com.majorproject.motomate.dto.WorkerDTOs.*;
import com.majorproject.motomate.model.SCOServiceRequest;
import com.majorproject.motomate.model.SCOWorker;
import com.majorproject.motomate.realtime.SseNotificationService;
import com.majorproject.motomate.repository.CustomerServiceRepository;
import com.majorproject.motomate.repository.SCOWorkerRepository;
import com.majorproject.motomate.repository.WorkerServiceRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.OptionalDouble;
import java.util.stream.Collectors;

/**
 * Business logic for the Worker Dashboard module.
 */
@Service
public class WorkerService {

    @Autowired
    private SCOWorkerRepository workerRepo;

    @Autowired
    private WorkerServiceRequestRepository requestRepo;

    @Autowired
    private SseNotificationService sseNotificationService;

    @Autowired
    private CustomerServiceRepository customerServiceRepository;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    public Optional<SCOWorker> getWorkerByUserId(String userId) {
        return workerRepo.findById(userId);
    }

    // ── Profile ────────────────────────────────────────────────────────────────

    public Optional<WorkerProfileResponse> getWorkerProfile(String workerId) {
        return workerRepo.findById(workerId).map(this::toProfileResponse);
    }

    // ── Status ─────────────────────────────────────────────────────────────────

    public WorkerStatusResponse getStatus(String workerId) {
        SCOWorker worker = workerRepo.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found: " + workerId));
        return WorkerStatusResponse.builder()
                .workerId(workerId)
                .status(worker.getAvailability())
                .message("Status fetched successfully")
                .build();
    }

    public WorkerStatusResponse updateStatus(String workerId, String newStatus) {
        SCOWorker worker = workerRepo.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found: " + workerId));

        if ("ON_LEAVE".equals(worker.getAvailability()) && "BUSY".equals(newStatus)) {
            throw new RuntimeException("Cannot set BUSY from ON_LEAVE. Return to AVAILABLE first.");
        }

        worker.setAvailability(newStatus);
        workerRepo.save(worker);

        return WorkerStatusResponse.builder()
                .workerId(workerId)
                .status(newStatus)
                .message("Status updated successfully")
                .build();
    }

    // ── Incoming Jobs ──────────────────────────────────────────────────────────

    public List<JobSummaryResponse> getIncomingJobs(String workerId) {
        SCOWorker worker = workerRepo.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found: " + workerId));

        // FIX: findIncomingJobsForWorker takes serviceCenterId, not workerId
        return requestRepo.findIncomingJobsForWorker(worker.getServiceCenterId())
                .stream()
                .map(this::toJobSummary)
                .collect(Collectors.toList());
    }

    public JobActionResponse acceptJob(String workerId, String jobId) {
        SCOWorker worker = workerRepo.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found: " + workerId));

        if ("ON_LEAVE".equals(worker.getAvailability())) {
            throw new RuntimeException("Cannot accept jobs while on leave.");
        }

        Optional<SCOServiceRequest> active = requestRepo.findCurrentJobForWorker(workerId);
        if (active.isPresent() && !active.get().getId().equals(jobId)) {
            throw new RuntimeException("You already have an active job. Complete it before accepting a new one.");
        }

        SCOServiceRequest job = requestRepo.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found: " + jobId));

        if (!workerId.equals(job.getAssignedWorkerId())) {
            throw new RuntimeException("This job is not assigned to you.");
        }

        job.setStatus("IN_PROGRESS");
        requestRepo.save(job);
        customerServiceRepository.findByScoRequestId(job.getId())
                .ifPresent(booking -> {
                    booking.setStatus("IN_PROGRESS");
                    customerServiceRepository.save(booking);
                });

        worker.setAvailability("BUSY");
        workerRepo.save(worker);

        // Notify customer via SSE
        String customerId = job.getCustomerId();
        if (customerId != null) {
            double rating = worker.getRating() != null ? worker.getRating() : 0.0;
            String skills = worker.getSkills() != null
                    ? "\"" + String.join("\",\"", worker.getSkills()) + "\""
                    : "";

            String assignedPayload = "{"
                    + "\"requestId\":\"" + jobId + "\","
                    + "\"workerName\":\"" + worker.getName() + "\","
                    + "\"workerRole\":\"" + worker.getRole() + "\","
                    + "\"workerPhone\":\"" + (worker.getPhone() != null ? worker.getPhone() : "") + "\","
                    + "\"workerRating\":" + rating + ","
                    + "\"workerSkills\":[" + skills + "]"
                    + "}";
            sseNotificationService.notifyCustomer(customerId, assignedPayload);

            String statusPayload = "{"
                    + "\"requestId\":\"" + jobId + "\","
                    + "\"status\":\"IN_PROGRESS\","
                    + "\"message\":\"Your service has started!\","
                    + "\"assignedWorkerName\":\"" + worker.getName() + "\""
                    + "}";
            sseNotificationService.notifyJobStatusUpdate(customerId, statusPayload);
        }

        return JobActionResponse.builder()
                .jobId(jobId)
                .status("IN_PROGRESS")
                .message("Job accepted successfully. You are now busy.")
                .workerAvailability("BUSY")
                .build();
    }

    public JobActionResponse rejectJob(String workerId, String jobId, String reason) {
        if (reason == null || reason.trim().length() < 5) {
            throw new RuntimeException("Rejection reason must be at least 5 characters.");
        }

        workerRepo.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found: " + workerId));

        SCOServiceRequest job = requestRepo.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found: " + jobId));

        if (!workerId.equals(job.getAssignedWorkerId())) {
            throw new RuntimeException("This job is not assigned to you.");
        }

        job.setStatus("PENDING");
        job.setAssignedWorkerId(null);
        job.setAssignedWorkerName(null);
        job.setCancellationReason("Worker rejected: " + reason.trim());
        requestRepo.save(job);

        return JobActionResponse.builder()
                .jobId(jobId)
                .status("PENDING")
                .message("Job rejected. It has been returned to the queue for reassignment.")
                .workerAvailability("AVAILABLE")
                .build();
    }

    // ── Current Job ────────────────────────────────────────────────────────────

    public Optional<JobSummaryResponse> getCurrentJob(String workerId) {
        workerRepo.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found: " + workerId));
        return requestRepo.findCurrentJobForWorker(workerId).map(this::toJobSummary);
    }

    public JobActionResponse updateJobStatus(String workerId, String jobId, String newStatus) {
        validateJobStatus(newStatus);

        SCOWorker worker = workerRepo.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found: " + workerId));

        SCOServiceRequest job = requestRepo.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found: " + jobId));

        if (!workerId.equals(job.getAssignedWorkerId())) {
            throw new RuntimeException("This job is not assigned to you.");
        }

        job.setStatus(newStatus);
        requestRepo.save(job);
        customerServiceRepository.findByScoRequestId(job.getId())
                .ifPresent(booking -> {
                    booking.setStatus(newStatus);
                    customerServiceRepository.save(booking);
                });

        String workerNewStatus = worker.getAvailability();
        if ("COMPLETED".equals(newStatus)) {
            worker.setAvailability("AVAILABLE");
            int completed = (worker.getCompletedJobs() != null ? worker.getCompletedJobs() : 0) + 1;
            worker.setCompletedJobs(completed);
            workerRepo.save(worker);
            workerNewStatus = "AVAILABLE";
        }

        String customerId = job.getCustomerId();
        if (customerId != null) {
            String label = getMilestoneLabel(newStatus);
            String statusPayload = "{"
                    + "\"requestId\":\"" + jobId + "\","
                    + "\"status\":\"" + newStatus + "\","
                    + "\"message\":\"" + label + "\","
                    + "\"assignedWorkerName\":\"" + worker.getName() + "\","
                    + "\"workerName\":\"" + worker.getName() + "\","
                    + "\"workerRole\":\"" + worker.getRole() + "\","
                    + "\"workerPhone\":\"" + (worker.getPhone() != null ? worker.getPhone() : "") + "\","
                    + "\"workerRating\":" + (worker.getRating() != null ? worker.getRating() : 0.0)
                    + "}";
            sseNotificationService.notifyJobStatusUpdate(customerId, statusPayload);
        }

        return JobActionResponse.builder()
                .jobId(jobId)
                .status(newStatus)
                .message("Job status updated to " + newStatus)
                .workerAvailability(workerNewStatus)
                .build();
    }

    private String getMilestoneLabel(String status) {
        switch (status) {
            case "REACHED_CENTER":  return "Worker has reached the service center";
            case "DIAGNOSING":      return "Vehicle diagnosis in progress";
            case "PARTS_ORDERED":   return "Waiting for parts to arrive";
            case "WORK_STARTED":    return "Repair work has started";
            case "IN_PROGRESS":     return "Service is in progress";
            case "WAITING_PARTS":   return "Waiting for parts";
            case "TESTING":         return "Final testing and quality check underway";
            case "COMPLETED":       return "Service completed successfully!";
            default:                return "Status updated to " + status;
        }
    }

    // ── Job History ────────────────────────────────────────────────────────────

    public PagedJobHistory getJobHistory(String workerId, String vehicleNumber,
            String fromStr, String toStr, int page, int size) {
        SCOWorker worker = workerRepo.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found: " + workerId));

        // FIX: history queries use serviceCenterId, not workerId
        String serviceCenterId = worker.getServiceCenterId();

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));
        Page<SCOServiceRequest> result;

        boolean hasVehicle = vehicleNumber != null && !vehicleNumber.isBlank();
        boolean hasFrom    = fromStr != null && !fromStr.isBlank();
        boolean hasTo      = toStr   != null && !toStr.isBlank();

        if (hasVehicle && hasFrom && hasTo) {
            LocalDate from = LocalDate.parse(fromStr, DATE_FMT);
            LocalDate to   = LocalDate.parse(toStr,   DATE_FMT);
            result = requestRepo.findHistoryByVehicleAndDateRange(serviceCenterId, vehicleNumber.trim(), from, to, pageable);
        } else if (hasVehicle) {
            result = requestRepo.findHistoryByVehicleNumber(serviceCenterId, vehicleNumber.trim(), pageable);
        } else if (hasFrom && hasTo) {
            LocalDate from = LocalDate.parse(fromStr, DATE_FMT);
            LocalDate to   = LocalDate.parse(toStr,   DATE_FMT);
            result = requestRepo.findHistoryByDateRange(serviceCenterId, from, to, pageable);
        } else {
            result = requestRepo.findByAssignedWorkerIdAndStatusOrderByUpdatedAtDesc(workerId, "COMPLETED", pageable);
        }

        List<JobHistoryResponse> content = result.getContent().stream()
                .map(this::toHistoryResponse)
                .collect(Collectors.toList());

        return PagedJobHistory.builder()
                .content(content)
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .page(page)
                .size(size)
                .build();
    }

    // ── Stats ──────────────────────────────────────────────────────────────────

    public WorkerStatsResponse getStats(String workerId) {
        SCOWorker worker = workerRepo.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found: " + workerId));

        long completed = requestRepo.countByAssignedWorkerIdAndStatus(workerId, "COMPLETED");
        long active    = requestRepo.findCurrentJobForWorker(workerId).isPresent() ? 1 : 0;

        // FIX: findIncomingJobsForWorker takes serviceCenterId
        long pending   = requestRepo.findIncomingJobsForWorker(worker.getServiceCenterId()).size();
        long total     = requestRepo.countByAssignedWorkerId(workerId);

        double completionRate = total > 0 ? (completed * 100.0 / total) : 0.0;

        return WorkerStatsResponse.builder()
                .completedJobs(completed)
                .activeJobCount(active)
                .pendingRequests(pending)
                .averageRating(worker.getRating() != null ? worker.getRating() : 0.0)
                .completionRate(Math.round(completionRate * 10.0) / 10.0)
                .avgResponseTime(null)
                .build();
    }

    // ── Ratings ────────────────────────────────────────────────────────────────

    public RatingsResponse getRatings(String workerId) {
        SCOWorker worker = workerRepo.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found: " + workerId));

        // Reads SCOServiceRequest.rated == true (field added to model)
        List<SCOServiceRequest> ratedRequests =
                requestRepo.findRatedRequestsByWorkerId(workerId);

        List<RatingEntry> entries = ratedRequests.stream()
                .map(req -> RatingEntry.builder()
                        .customerName(req.getCustomerName() != null ? req.getCustomerName() : "Customer")
                        .vehicleNumber(req.getVehicleNumber())
                        // FIX: reads customerRating field (not notes hack)
                        .rating(req.getCustomerRating())
                        .feedback(req.getCustomerFeedback())
                        .date(req.getUpdatedAt() != null
                                ? req.getUpdatedAt().toLocalDate().toString()
                                : null)
                        .createdAt(req.getUpdatedAt())
                        .build())
                .sorted((a, b) -> {
                    if (a.getCreatedAt() == null && b.getCreatedAt() == null) return 0;
                    if (a.getCreatedAt() == null) return 1;
                    if (b.getCreatedAt() == null) return -1;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .collect(Collectors.toList());

        OptionalDouble avg = entries.stream()
                .mapToDouble(e -> e.getRating() != null ? e.getRating() : 0.0)
                .average();

        double avgRating = avg.orElse(worker.getRating() != null ? worker.getRating() : 0.0);

        return RatingsResponse.builder()
                .averageRating(Math.round(avgRating * 10.0) / 10.0)
                .totalRatings(entries.size())
                .ratings(entries)
                .build();
    }

    /**
     * Customer submits a rating for a completed job.
     * Called by: PUT /api/services/{bookingId}/rate
     *
     * The controller resolves CustomerServiceModel.id → SCOServiceRequest.id
     * before calling here, so requestId is always a valid SCOServiceRequest.id.
     */
    public void submitRating(String requestId, double rating, String feedback) {
        SCOServiceRequest req = requestRepo.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found: " + requestId));

        if (req.isRated()) {
            throw new IllegalStateException("This job has already been rated.");
        }

        // FIX: tolerate slight sync lag — accept COMPLETED or TESTING (near-complete)
        // The CustomerServiceModel may already show COMPLETED while the
        // SCOServiceRequest still says the last worker-set status.
        List<String> rateableStatuses = List.of("COMPLETED", "TESTING", "WORK_STARTED");
        if (!rateableStatuses.contains(req.getStatus())) {
            throw new IllegalStateException(
                "Can only rate a completed job. Current status: " + req.getStatus());
        }

        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5.");
        }

        req.setCustomerRating(rating);
        req.setCustomerFeedback(feedback != null ? feedback.trim() : null);
        req.setRated(true);
        req.setUpdatedAt(LocalDateTime.now());
        requestRepo.save(req);

        if (req.getAssignedWorkerId() != null) {
            updateWorkerAverage(req.getAssignedWorkerId());
        }
    }

    /** Recalculate and persist the average rating on the SCOWorker document. */
    private void updateWorkerAverage(String workerId) {
        List<SCOServiceRequest> rated =
                requestRepo.findRatedRequestsByWorkerId(workerId);

        OptionalDouble avg = rated.stream()
                .mapToDouble(r -> r.getCustomerRating() != null ? r.getCustomerRating() : 0.0)
                .average();

        double rounded = avg.isPresent()
                ? Math.round(avg.getAsDouble() * 10.0) / 10.0
                : 0.0;

        workerRepo.findById(workerId).ifPresent(w -> {
            w.setRating(rounded);
            workerRepo.save(w);
        });
    }

    // ── Mappers ────────────────────────────────────────────────────────────────

    private WorkerProfileResponse toProfileResponse(SCOWorker w) {
        return WorkerProfileResponse.builder()
                .id(w.getId())
                .name(w.getName())
                .phone(w.getPhone())
                .email(w.getEmail())
                .role(w.getRole())
                .serviceCenterId(w.getServiceCenterId())
                .availability(w.getAvailability())
                .skills(w.getSkills())
                .completedJobs(w.getCompletedJobs())
                .rating(w.getRating())
                .active(w.isActive())
                .build();
    }

    private JobSummaryResponse toJobSummary(SCOServiceRequest r) {
        return JobSummaryResponse.builder()
                .id(r.getId())
                .customerName(r.getCustomerName())
                .customerPhone(r.getCustomerPhone())
                .customerEmail(r.getCustomerEmail())
                .vehicleType(r.getVehicleType())
                .brand(r.getBrand())
                .vehicleModel(r.getVehicleModel())
                .vehicleNumber(r.getVehicleNumber())
                .serviceNames(r.getServiceNames())
                .totalPrice(r.getTotalPrice())
                .totalDurationMinutes(r.getTotalDurationMinutes())
                .scheduledDate(r.getScheduledDate() != null ? r.getScheduledDate().toString() : null)
                .scheduledTime(r.getScheduledTime() != null ? r.getScheduledTime().toString() : null)
                .urgency(r.getUrgency())
                .serviceMode(r.getServiceMode())
                .address(r.getAddress())
                .assignedWorkerId(r.getAssignedWorkerId())
                .assignedWorkerName(r.getAssignedWorkerName())
                .status(r.getStatus())
                .additionalNotes(r.getAdditionalNotes())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }

    private JobHistoryResponse toHistoryResponse(SCOServiceRequest r) {
        return JobHistoryResponse.builder()
                .id(r.getId())
                .customerName(r.getCustomerName())
                .vehicleNumber(r.getVehicleNumber())
                .brand(r.getBrand())
                .vehicleModel(r.getVehicleModel())
                .serviceNames(r.getServiceNames())
                .totalPrice(r.getTotalPrice())
                .totalDurationMinutes(r.getTotalDurationMinutes())
                .scheduledDate(r.getScheduledDate() != null ? r.getScheduledDate().toString() : null)
                .status(r.getStatus())
                // FIX: read from customerRating field instead of parsing notes string
                .rating(r.getCustomerRating() != null ? r.getCustomerRating() : 0.0)
                .feedback(r.getCustomerFeedback())
                .updatedAt(r.getUpdatedAt())
                .build();
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private void validateJobStatus(String status) {
        List<String> valid = List.of(
                "REACHED_CENTER", "DIAGNOSING", "PARTS_ORDERED",
                "WORK_STARTED", "IN_PROGRESS", "WAITING_PARTS",
                "TESTING", "COMPLETED");
        if (!valid.contains(status)) {
            throw new RuntimeException("Invalid job status: " + status + ". Allowed: " + valid);
        }
    }
}