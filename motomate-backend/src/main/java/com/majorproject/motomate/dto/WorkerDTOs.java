package com.majorproject.motomate.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

//import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTOs for the Worker Dashboard module.
 */
public class WorkerDTOs {

    // ── Request Payloads ───────────────────────────────────────────────────────

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusUpdateRequest {
        private String status; // AVAILABLE | BUSY | ON_LEAVE | OFF_DUTY
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JobStatusUpdateRequest {
        private String status; // IN_PROGRESS | WAITING_PARTS | COMPLETED
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RejectJobRequest {
        private String reason;
    }

    // ── Response DTOs ──────────────────────────────────────────────────────────

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WorkerProfileResponse {
        private String id;
        private String name;
        private String phone;
        private String email;
        private String role;
        private String serviceCenterId;
        private String availability;
        private List<String> skills;
        private Integer completedJobs;
        private Double rating;
        private boolean active;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WorkerStatusResponse {
        private String workerId;
        private String status;
        private String message;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WorkerStatsResponse {
        private long completedJobs;
        private long activeJobCount;
        private long pendingRequests;
        private Double averageRating;
        private Double completionRate;      // percentage
        private Long avgResponseTime;       // minutes
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JobSummaryResponse {
        private String id;
        private String customerName;
        private String customerPhone;
        private String customerEmail;
        private String vehicleType;
        private String brand;
        private String vehicleModel;
        private String vehicleNumber;
        private List<String> serviceNames;
        private Double totalPrice;
        private Integer totalDurationMinutes;
        private String scheduledDate;
        private String scheduledTime;
        private String urgency;
        private String serviceMode;
        private String address;
        private String assignedWorkerId;
        private String assignedWorkerName;
        private String status;
        private String additionalNotes;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JobHistoryResponse {
        private String id;
        private String customerName;
        private String vehicleNumber;
        private String brand;
        private String vehicleModel;
        private List<String> serviceNames;
        private Double totalPrice;
        private Integer totalDurationMinutes;
        private String scheduledDate;
        private String status;
        private Double rating;
        private String feedback;
        private LocalDateTime updatedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RatingEntry {
        private String customerName;
        private String vehicleNumber;
        private Double rating;
        private String feedback;
        private String date;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RatingsResponse {
        private Double averageRating;
        private long totalRatings;
        private List<RatingEntry> ratings;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JobActionResponse {
        private String jobId;
        private String status;
        private String message;
        private String workerAvailability;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PagedJobHistory {
        private List<JobHistoryResponse> content;
        private long totalElements;
        private int totalPages;
        private int page;
        private int size;
    }
}
