package com.majorproject.motomate.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public class FleetServiceDTOs {

    // ── Single Schedule Request ──────────────────────────────────
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ServiceRequest {

        @NotBlank(message = "Vehicle ID is required")
        private String vehicleId;

        // Legacy single serviceType kept for backward compat
        private String serviceType;

        // NEW: multi-service selection (like customer flow)
        private List<String> selectedServiceNames;   // e.g. ["Oil Change", "Brake Service"]
        private List<String> selectedServiceIds;     // SCOService IDs when matched

        @NotBlank(message = "Service center is required")
        private String serviceCenter;

        private String serviceCenterId;

        // NEW: preferred worker (fleet manager can pick high-rated/available worker)
        private String preferredWorkerId;
        private String preferredWorkerName;

        @NotNull(message = "Scheduled date is required")
        private LocalDate scheduledDate;

        private LocalTime scheduledTime;
        private Double estimatedCost;
        private String notes;
    }

    // ── Bulk Schedule Request ────────────────────────────────────
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BulkServiceRequest {

        // Fix 7: Server-side enforcement of minimum 2 vehicles
        @NotNull(message = "Vehicle list is required")
        @Size(min = 2, message = "Bulk booking requires at least 2 vehicles")
        private List<String> vehicleIds;

        // Legacy single serviceType kept for backward compat
        private String serviceType;

        // NEW: multi-service selection
        private List<String> selectedServiceNames;   // display names
        private List<String> selectedServiceIds;     // SCOService IDs

        @NotBlank(message = "Service center is required")
        private String serviceCenter;

        private String serviceCenterId;

        // NEW: preferred worker for bulk jobs
        private String preferredWorkerId;
        private String preferredWorkerName;

        @NotNull(message = "Scheduled date is required")
        private LocalDate scheduledDate;

        private LocalTime scheduledTime;
        private Double estimatedCostPerVehicle;
        private String notes;
    }

    // ── Service Response ─────────────────────────────────────────
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ServiceResponse {
        private String id;
        private String vehicleId;
        private String vehicleNumber;
        private String vehicleType;
        private String serviceType;
        // NEW: multi-service names in response
        private List<String> selectedServiceNames;
        private String serviceCenter;
        private String serviceCenterId;
        private String assignedWorker;
        private String assignedWorkerId;
        private String scoRequestId;    // linked SCOServiceRequest id — for SCO dashboard
        private String scheduledDate;
        private String scheduledTime;
        private Double estimatedCost;
        private Double actualCost;
        private String status;
        private String notes;
        private String createdAt;
        private String updatedAt;
        private String completedAt;
        private String bulkBatchId;
        // Fix 9: Discount fields in response
        private Integer discountPercent;
        private Double  discountAmount;
        private Double  finalCost;
        // Rating
        private boolean rated;
        private Integer serviceCenterRating;
        private String  serviceCenterFeedback;
    }

    // ── Status Update ────────────────────────────────────────────
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusUpdateRequest {
        @NotBlank
        private String status;
        private String assignedWorker;
        private String assignedWorkerId;
        private Double actualCost;
        private String notes;
    }

    // ── Report ───────────────────────────────────────────────────
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MaintenanceReport {
        private List<ServiceResponse> services;
        private double totalCost;
        private double totalSavings;   // Fix 9: total discount savings for the period
        private long totalServices;
        private long completedServices;
        private long pendingServices;
        private List<MonthlyCostStat> monthlyCostStats;
        private List<VehicleServiceStat> vehicleServiceStats;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyCostStat {
        private String month;
        private double cost;
        private long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VehicleServiceStat {
        private String vehicleNumber;
        private long serviceCount;
        private double totalCost;
    }

    // ── Bulk Schedule Summary (returned alongside individual services) ─
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BulkScheduleSummary {
        private List<ServiceResponse> services;
        private int vehicleCount;
        private double subtotal;
        private int discountPercent;
        private double discountAmount;
        private double totalPayable;
        private String batchId;
    }
}
