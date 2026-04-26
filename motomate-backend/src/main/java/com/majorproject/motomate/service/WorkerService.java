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
//         SCOServiceRequest job = requestRepo.findById(jobId)
//         .orElseThrow(() -> new RuntimeException("Job not found: " + jobId));

// // ADD THIS TEMPORARILY:
// System.out.println("DEBUG >>> " + job.toString());
        SCOWorker worker = workerRepo.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found: " + workerId));

        // If worker is on leave, don't allow direct transition to BUSY
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
        // Ensure worker exists
        workerRepo.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found: " + workerId));

        return requestRepo.findIncomingJobsForWorker(workerId)
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

        // Check if worker already has an active job
        Optional<SCOServiceRequest> active = requestRepo.findCurrentJobForWorker(workerId);
if (active.isPresent() && !active.get().getId().equals(jobId)) {
    throw new RuntimeException("You already have an active job. Complete it before accepting a new one.");
}

        SCOServiceRequest job = requestRepo.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found: " + jobId));

        if (!workerId.equals(job.getAssignedWorkerId())) {
            throw new RuntimeException("This job is not assigned to you.");
        }

        // Update job status to IN_PROGRESS
        job.setStatus("IN_PROGRESS");
        requestRepo.save(job);
        customerServiceRepository.findByScoRequestId(job.getId())
    .ifPresent(booking -> {
        booking.setStatus("IN_PROGRESS");
        customerServiceRepository.save(booking);
    });

        // Update worker availability
        worker.setAvailability("BUSY");
        workerRepo.save(worker);

        // ── Notify the customer via SSE ──────────────────────────────────────
        String customerId = job.getCustomerId(); // adjust getter to match your model

        if (customerId != null) {
            double rating = worker.getRating() != null ? worker.getRating() : 0.0;
            String skills = worker.getSkills() != null
                    ? "\"" + String.join("\",\"", worker.getSkills()) + "\""
                    : "";

            // 1. worker_assigned_to_customer — populates the WorkerCard in the UI
            String assignedPayload = "{"
                    + "\"requestId\":\""    + jobId                   + "\","
                    + "\"workerName\":\""   + worker.getName()         + "\","
                    + "\"workerRole\":\""   + worker.getRole()         + "\","
                    + "\"workerPhone\":\""  + (worker.getPhone() != null ? worker.getPhone() : "") + "\","
                    + "\"workerRating\":"   + rating                  + ","
                    + "\"workerSkills\":["  + skills                  + "]"
                    + "}";
            sseNotificationService.notifyCustomer(customerId, assignedPayload);

            // 2. job_status_updated — updates the status badge to IN_PROGRESS
            String statusPayload = "{"
                    + "\"requestId\":\""         + jobId             + "\","
                    + "\"status\":\"IN_PROGRESS\","
                    + "\"message\":\"Your service has started!\","
                    + "\"assignedWorkerName\":\"" + worker.getName() + "\""
                    + "}";
            sseNotificationService.notifyJobStatusUpdate(customerId, statusPayload);
        }
        // ────────────────────────────────────────────────────────────────────

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

        // Mark as unassigned so SCO can reassign
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

        // Reset availability when job is completed
        String workerNewStatus = worker.getAvailability();
        if ("COMPLETED".equals(newStatus)) {
            worker.setAvailability("AVAILABLE");
            int completed = (worker.getCompletedJobs() != null ? worker.getCompletedJobs() : 0) + 1;
            worker.setCompletedJobs(completed);
            workerRepo.save(worker);
            workerNewStatus = "AVAILABLE";
        }

        // ── Notify customer of every milestone via SSE ───────────────────────
        String customerId = job.getCustomerId();
        if (customerId != null) {
            String label = getMilestoneLabel(newStatus);
            String statusPayload = "{"
                    + "\"requestId\":\""          + jobId            + "\","
                    + "\"status\":\""             + newStatus        + "\","
                    + "\"message\":\""            + label            + "\","
                    + "\"assignedWorkerName\":\"" + worker.getName() + "\","
                    + "\"workerName\":\""         + worker.getName() + "\","
                    + "\"workerRole\":\""         + worker.getRole() + "\","
                    + "\"workerPhone\":\""        + (worker.getPhone() != null ? worker.getPhone() : "") + "\","
                    + "\"workerRating\":"         + (worker.getRating() != null ? worker.getRating() : 0.0)
                    + "}";
            sseNotificationService.notifyJobStatusUpdate(customerId, statusPayload);
        }
        // ────────────────────────────────────────────────────────────────────

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
        workerRepo.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found: " + workerId));

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));
        Page<SCOServiceRequest> result;

        boolean hasVehicle = vehicleNumber != null && !vehicleNumber.isBlank();
        boolean hasFrom    = fromStr != null && !fromStr.isBlank();
        boolean hasTo      = toStr != null && !toStr.isBlank();

        if (hasVehicle && hasFrom && hasTo) {
            LocalDate from = LocalDate.parse(fromStr, DATE_FMT);
            LocalDate to   = LocalDate.parse(toStr, DATE_FMT);
            result = requestRepo.findHistoryByVehicleAndDateRange(workerId, vehicleNumber.trim(), from, to, pageable);
        } else if (hasVehicle) {
            result = requestRepo.findHistoryByVehicleNumber(workerId, vehicleNumber.trim(), pageable);
        } else if (hasFrom && hasTo) {
            LocalDate from = LocalDate.parse(fromStr, DATE_FMT);
            LocalDate to   = LocalDate.parse(toStr, DATE_FMT);
            result = requestRepo.findHistoryByDateRange(workerId, from, to, pageable);
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

    // ── Ratings ────────────────────────────────────────────────────────────────

    public RatingsResponse getRatings(String workerId) {
        workerRepo.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found: " + workerId));

        // Gather completed jobs that have a customer rating
        List<SCOServiceRequest> completedJobs = requestRepo
                .findByAssignedWorkerIdAndStatus(workerId, "COMPLETED");

        // Filter jobs that actually have ratings (stored in cancellationReason field
        // as a placeholder – in real impl, add a 'rating' field to SCOServiceRequest)
        // For now we generate rating entries from any job with notes about rating
        // In production: add customerRating and customerFeedback fields to SCOServiceRequest
        List<RatingEntry> entries = completedJobs.stream()
                .filter(j -> j.getAdditionalNotes() != null && j.getAdditionalNotes().contains("RATING:"))
                .map(j -> {
                    // Parse embedded rating from notes (temporary until model updated)
                    double rating = parseRatingFromNotes(j.getAdditionalNotes());
                    String feedback = parseFeedbackFromNotes(j.getAdditionalNotes());
                    return RatingEntry.builder()
                            .customerName(j.getCustomerName())
                            .vehicleNumber(j.getVehicleNumber())
                            .rating(rating)
                            .feedback(feedback)
                            .date(j.getUpdatedAt() != null ? j.getUpdatedAt().toLocalDate().toString() : null)
                            .createdAt(j.getUpdatedAt())
                            .build();
                })
                .collect(Collectors.toList());

        OptionalDouble avg = entries.stream()
                .mapToDouble(RatingEntry::getRating)
                .average();

        // Also use worker's stored average rating
        SCOWorker worker = workerRepo.findById(workerId).orElseThrow();
        double avgRating = avg.orElse(worker.getRating() != null ? worker.getRating() : 0.0);

        return RatingsResponse.builder()
                .averageRating(avgRating)
                .totalRatings(entries.isEmpty() ? (worker.getCompletedJobs() != null ? worker.getCompletedJobs() : 0) : entries.size())
                .ratings(entries)
                .build();
    }

    // ── Stats ──────────────────────────────────────────────────────────────────

    public WorkerStatsResponse getStats(String workerId) {
        SCOWorker worker = workerRepo.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found: " + workerId));

        long completed = requestRepo.countByAssignedWorkerIdAndStatus(workerId, "COMPLETED");
        long active    = requestRepo.findCurrentJobForWorker(workerId).isPresent() ? 1 : 0;
        long pending   = requestRepo.findIncomingJobsForWorker(workerId).size();
        long total     = requestRepo.countByAssignedWorkerId(workerId);

        double completionRate = total > 0 ? (completed * 100.0 / total) : 0.0;

        return WorkerStatsResponse.builder()
                .completedJobs(completed)
                .activeJobCount(active)
                .pendingRequests(pending)
                .averageRating(worker.getRating() != null ? worker.getRating() : 0.0)
                .completionRate(Math.round(completionRate * 10.0) / 10.0)
                .avgResponseTime(null) // optional: track response times
                .build();
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
                .rating(parseRatingFromNotes(r.getAdditionalNotes()))
                .feedback(parseFeedbackFromNotes(r.getAdditionalNotes()))
                .updatedAt(r.getUpdatedAt())
                .build();
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private void validateStatus(String status) {
        List<String> valid = List.of("AVAILABLE", "BUSY", "ON_LEAVE", "OFF_DUTY");
        if (!valid.contains(status)) {
            throw new RuntimeException("Invalid status: " + status + ". Allowed: " + valid);
        }
    }

    private void validateJobStatus(String status) {
        List<String> valid = List.of(
            "REACHED_CENTER",
            "DIAGNOSING",
            "PARTS_ORDERED",
            "WORK_STARTED",
            "IN_PROGRESS",
            "WAITING_PARTS",
            "TESTING",
            "COMPLETED"
        );
        if (!valid.contains(status)) {
            throw new RuntimeException("Invalid job status: " + status + ". Allowed: " + valid);
        }
    }

    private double parseRatingFromNotes(String notes) {
        if (notes == null) return 0.0;
        try {
            int idx = notes.indexOf("RATING:");
            if (idx < 0) return 0.0;
            String sub = notes.substring(idx + 7).split("[^0-9.]")[0];
            return Double.parseDouble(sub.trim());
        } catch (Exception e) {
            return 0.0;
        }
    }

    private String parseFeedbackFromNotes(String notes) {
        if (notes == null) return null;
        int idx = notes.indexOf("FEEDBACK:");
        if (idx < 0) return null;
        return notes.substring(idx + 9).trim();
    }
}