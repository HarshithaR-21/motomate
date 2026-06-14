package com.majorproject.motomate.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * All SOS-related DTOs with full validation.
 */
public class SOSDTOs {

    // ── Request DTO submitted by customer ──────────────────────────────────────
    public static class SOSCreateRequest {

        @NotBlank(message = "Customer ID is required")
        public String customerId;

        // Vehicle info (optional but constrained)
        @Size(max = 20, message = "Vehicle number must not exceed 20 characters")
        @Pattern(regexp = "^[A-Z0-9\\s\\-]*$", message = "Vehicle number must contain only alphanumeric characters, spaces, or hyphens")
        public String vehicleNumber;

        @Size(max = 50, message = "Vehicle type must not exceed 50 characters")
        public String vehicleType;

        @Size(max = 50, message = "Vehicle brand must not exceed 50 characters")
        public String vehicleBrand;

        @Size(max = 50, message = "Vehicle model must not exceed 50 characters")
        public String vehicleModel;

        // Emergency questionnaire – all required
        @NotBlank(message = "Emergency type is required")
        @Pattern(
            regexp = "ACCIDENT|VEHICLE_BREAKDOWN|FLAT_TYRE|BATTERY_DEAD|ENGINE_FAILURE|FUEL_EMPTY|SAFETY_CONCERN|OTHER",
            message = "Invalid emergency type"
        )
        public String emergencyType;

        @NotBlank(message = "Vehicle status is required")
        @Pattern(
            regexp = "CANNOT_MOVE|MOVE_SLOWLY|OPERATIONAL",
            message = "Invalid vehicle status"
        )
        public String vehicleStatus;

        @NotBlank(message = "Traffic impact is required")
        @Pattern(
            regexp = "BLOCKING_TRAFFIC|NOT_BLOCKING",
            message = "Invalid traffic impact value"
        )
        public String trafficImpact;

        @NotBlank(message = "Injury status is required")
        @Pattern(
            regexp = "INJURED|NO_INJURY",
            message = "Invalid injury status value"
        )
        public String injuryStatus;

        @Size(max = 500, message = "Additional description must not exceed 500 characters")
        public String additionalDescription;

        // Location – required
        @NotNull(message = "Latitude is required")
        @DecimalMin(value = "-90.0",  message = "Latitude must be >= -90")
        @DecimalMax(value = "90.0",   message = "Latitude must be <= 90")
        public Double latitude;

        @NotNull(message = "Longitude is required")
        @DecimalMin(value = "-180.0", message = "Longitude must be >= -180")
        @DecimalMax(value = "180.0",  message = "Longitude must be <= 180")
        public Double longitude;

        @Size(max = 500, message = "Address must not exceed 500 characters")
        public String address;
    }

    // ── Response DTO ──────────────────────────────────────────────────────────
    public static class SOSResponse {
        public String id;
        public String customerId;
        public String customerName;
        public String customerPhone;
        public String vehicleNumber;
        public String vehicleType;
        public String vehicleBrand;
        public String vehicleModel;
        public String emergencyType;
        public String vehicleStatus;
        public String trafficImpact;
        public String injuryStatus;
        public String additionalDescription;
        public Double latitude;
        public Double longitude;
        public String address;
        public Integer priorityScore;
        public String priorityLevel;
        public String assignedServiceCenterId;
        public String assignedServiceCenterName;
        public String assignedWorkerId;
        public String assignedWorkerName;
        public String assignedWorkerPhone;
        public String status;
        public LocalDateTime createdAt;
        public LocalDateTime updatedAt;
        public LocalDateTime workerAssignedAt;
        public LocalDateTime workerArrivedAt;
        public LocalDateTime serviceCompletedAt;
        public Long minutesSinceRequest;
        public Long estimatedArrivalMinutes;     // ETA from worker to customer

        // Worker live location (for tracking)
        public Double workerLatitude;
        public Double workerLongitude;
        public Double distanceToWorkerKm;       // distance remaining

        // Chat room ID (opens chat between customer & worker)
        public String chatRoomId;

        // How many SCs were notified (for customer UI)
        public Integer notifiedServiceCentersCount;
    }

    // ── Status Update DTO ─────────────────────────────────────────────────────
    public static class SOSStatusUpdateRequest {

        @NotBlank(message = "Status is required")
        @Pattern(
            regexp = "WORKER_EN_ROUTE|WORKER_ARRIVED|SERVICE_IN_PROGRESS|SERVICE_COMPLETED",
            message = "Invalid status transition"
        )
        public String status;

        @NotBlank(message = "Worker ID is required")
        public String workerId;
    }

    // ── SCO Accept/Reject SOS ─────────────────────────────────────────────────
    public static class SOSAcceptRequest {
        @NotBlank(message = "Service Center ID is required")
        public String serviceCenterId;
    }

    public static class SOSRejectRequest {
        @NotBlank(message = "Service Center ID is required")
        public String serviceCenterId;

        @Size(max = 200)
        public String reason;
    }

    // ── Manual Worker Assignment by SCO ──────────────────────────────────────
    public static class ManualWorkerAssignRequest {

        @NotBlank(message = "Worker ID is required")
        public String workerId;
    }

    // ── Cancel SOS ────────────────────────────────────────────────────────────
    public static class SOSCancelRequest {

        @NotBlank(message = "Customer ID is required")
        public String customerId;

        @Size(max = 300, message = "Cancel reason must not exceed 300 characters")
        public String reason;
    }

    // ── Emergency Contact DTOs ────────────────────────────────────────────────
    public static class EmergencyContactRequest {

        @NotBlank(message = "Contact name is required")
        @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
        public String name;

        @NotBlank(message = "Phone number is required")
        @Pattern(
            regexp = "^[+]?[0-9]{7,15}$",
            message = "Phone number must be 7–15 digits, optionally starting with +"
        )
        public String phone;

        @NotBlank(message = "Relation is required")
        @Size(max = 50, message = "Relation must not exceed 50 characters")
        public String relation;
    }

    public static class EmergencyContactsResponse {
        public String customerId;
        public List<EmergencyContactRequest> contacts;
    }

    // ── Available workers list for SCO manual assign ──────────────────────────
    public static class AvailableWorkerDTO {
        public String workerId;
        public String workerName;
        public String workerPhone;
        public String availability;
        public Double distanceKm;
        public Double latitude;
        public Double longitude;
        public long   activeSOSCount;
    }
}
