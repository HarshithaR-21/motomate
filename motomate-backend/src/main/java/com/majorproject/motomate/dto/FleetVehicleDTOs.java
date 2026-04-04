package com.majorproject.motomate.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class FleetVehicleDTOs {

    // ── Request DTO ─────────────────────────────────────────────
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VehicleRequest {

        @NotBlank(message = "Vehicle number is required")
        @Pattern(regexp = "^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$",
                 message = "Invalid vehicle number format (e.g. KA01AB1234)")
        private String vehicleNumber;

        @NotBlank(message = "Vehicle type is required")
        private String vehicleType; // CAR, BIKE, TRUCK

        @NotBlank(message = "Brand is required")
        private String brand;

        private String model;
        private String fuelType;
        private String year;

        @NotBlank(message = "Issue description is required")
        private String issueDescription;

        private String fleetTag;
    }

    // ── Response DTO ────────────────────────────────────────────
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VehicleResponse {
        private String id;
        private String vehicleNumber;
        private String vehicleType;
        private String brand;
        private String model;
        private String fuelType;
        private String year;
        private String issueDescription;
        private String fleetTag;
        private String status;
        private String createdAt;
        private String updatedAt;

        // enriched
        private String activeServiceStatus;
        private String assignedWorker;
        private String serviceCenter;
    }

    // ── Dashboard Stats DTO ─────────────────────────────────────
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FleetDashboardStats {
        private long totalVehicles;
        private long activeServices;
        private long completedServices;
        private long pendingRequests;
        private long inProgressServices;
        private double totalMaintenanceCost;
    }
}
