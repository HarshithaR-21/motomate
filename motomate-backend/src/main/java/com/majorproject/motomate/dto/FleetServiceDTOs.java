package com.majorproject.motomate.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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

        @NotBlank(message = "Service type is required")
        private String serviceType;

        @NotBlank(message = "Service center is required")
        private String serviceCenter;

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

        @NotNull(message = "At least one vehicle must be selected")
        private List<String> vehicleIds;

        @NotBlank(message = "Service type is required")
        private String serviceType;

        @NotBlank(message = "Service center is required")
        private String serviceCenter;

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
        private String serviceCenter;
        private String assignedWorker;
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
}
