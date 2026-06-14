package com.majorproject.motomate.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.util.List;

/**
 * All DTOs for the EV module.
 */
public class EVDTOs {

    // ── Vehicle DTOs ─────────────────────────────────────────────────────────

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class EVVehicleRequest {
        @NotBlank private String vehicleNumber;
        @NotBlank private String manufacturer;
        @NotBlank private String model;
        private String color;
        private Integer yearOfManufacture;

        @NotNull @Positive
        private Double batteryCapacityKwh;

        // Not collected at registration — battery level varies over time.
        @DecimalMin("0.0") @DecimalMax("100.0")
        private Double currentBatteryPercentage;

        @NotBlank private String chargingPortType;

        @NotNull @Positive
        private Double vehicleRangeKm;

        private boolean fastChargingSupported;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class EVVehicleResponse {
        private String id;
        private String ownerId;
        private String vehicleNumber;
        private String manufacturer;
        private String model;
        private String color;
        private Integer yearOfManufacture;
        private Double batteryCapacityKwh;
        private Double currentBatteryPercentage;
        private String chargingPortType;
        private Double vehicleRangeKm;
        private boolean fastChargingSupported;
        private LocalDateTime createdAt;
    }

    // ── Workshop DTOs ────────────────────────────────────────────────────────

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class EVWorkshopResponse {
        private String id;
        private String workshopName;
        private String ownerName;
        private String phoneNumber;
        private String email;
        private String address;
        private String city;
        private String state;
        private Double latitude;
        private Double longitude;
        private String description;
        private String certificationLevel;
        private String operatingHours;
        private List<String> openDays;
        private List<String> supportedBrands;
        private List<String> supportedChargingPorts;
        private Double rating;
        private Integer totalReviews;
        private String status;
        private Double distanceKm;         // populated when customer location is provided
        private Integer availableWorkers;  // populated for workshop listings
    }

    // ── Service Request DTOs ─────────────────────────────────────────────────

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class EVBookServiceRequest {
        @NotBlank private String vehicleId;
        @NotBlank private String selectedWorkshopId;
        @NotBlank private String serviceType;
        private List<String> serviceNames;
        private String description;

        @NotNull private Double customerLatitude;
        @NotNull private Double customerLongitude;
        private String customerAddress;
        private List<String> uploadedImagePaths;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class EVServiceRequestResponse {
        private String id;
        private String customerId;
        private String vehicleId;
        private String vehicleNumber;
        private String vehicleMake;
        private String vehicleModel;
        private String selectedWorkshopId;
        private String selectedWorkshopName;
        private String assignedWorkerId;
        private String assignedWorkerName;
        private String assignedWorkerPhone;
        private String serviceType;
        private List<String> serviceNames;
        private String description;
        private Double customerLatitude;
        private Double customerLongitude;
        private String customerAddress;
        private Double distanceKm;
        private String status;
        private Double rating;
        private String review;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private LocalDateTime assignedAt;
        private LocalDateTime completedAt;
        private Integer estimatedArrivalMinutes;
    }

    // ── Worker update location ────────────────────────────────────────────────

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class EVWorkerLocationUpdate {
        @NotNull private Double latitude;
        @NotNull private Double longitude;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class EVWorkerResponse {
        private String id;
        private String workshopId;
        private String workshopName;
        private String name;
        private String phone;
        private String email;
        private String specialization;
        private boolean evCertified;
        private boolean batterySpecialist;
        private boolean chargingSpecialist;
        private Double currentLatitude;
        private Double currentLongitude;
        private String availabilityStatus;
        private List<String> skills;
        private Integer completedJobs;
        private Double rating;
    }

    // ── Charging Request DTOs ─────────────────────────────────────────────────

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class EVChargingRequestDto {
        @NotBlank private String vehicleId;
        private String vehicleNumber;
        private String chargingPortType;

        @NotNull @DecimalMin("0.0") @DecimalMax("100.0")
        private Double currentBatteryPercentage;

        @DecimalMin("0.0") @DecimalMax("100.0")
        private Double targetBatteryPercentage;

        @NotNull private Double customerLatitude;
        @NotNull private Double customerLongitude;
        private String customerAddress;

        @Builder.Default
        private boolean emergencyFlag = false;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class EVChargingRequestResponse {
        private String id;
        private String customerId;
        private String vehicleId;
        private String vehicleNumber;
        private String chargingPortType;
        private Double currentBatteryPercentage;
        private Double targetBatteryPercentage;
        private Double customerLatitude;
        private Double customerLongitude;
        private String customerAddress;
        private boolean emergencyFlag;
        private String assignedChargingVehicleId;
        private String assignedDriverName;
        private String assignedDriverPhone;
        private Double distanceKm;
        private String status;
        private String priority;
        private LocalDateTime createdAt;
        private Integer estimatedArrivalMinutes;
    }

    // ── Admin stats ──────────────────────────────────────────────────────────

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class EVAdminStats {
        private long totalWorkshops;
        private long activeWorkshops;
        private long totalTechnicians;
        private long availableTechnicians;
        private long activeServiceRequests;
        private long completedServiceRequests;
        private long activeChargingRequests;
        private long completedChargingRequests;
        private long emergencyRequests;
        private long totalChargingVehicles;
    }

    // ── Workshop Dashboard Stats ──────────────────────────────────────────────

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class EVWorkshopStats {
        private long totalRequests;
        private long pendingRequests;
        private long activeRequests;
        private long completedRequests;
        private long cancelledRequests;
        private long availableWorkers;
        private long assignedWorkers;
        private long offDutyWorkers;
    }

    // ── Status Update ────────────────────────────────────────────────────────

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class StatusUpdateRequest {
        @NotBlank private String status;
        private String reason;
    }

    // ── Rating ───────────────────────────────────────────────────────────────

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class EVRatingRequest {
        @NotNull @Min(1) @Max(5) private Double rating;
        private String review;
    }
}