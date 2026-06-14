package com.majorproject.motomate.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Represents an emergency SOS request submitted by a customer.
 * Collection: sos_requests
 *
 * Status flow:
 *   SOS_SUBMITTED (broadcast to nearby SCs) →
 *   SERVICE_CENTER_ACCEPTED (one SC accepted) →
 *   WORKER_ASSIGNED → WORKER_EN_ROUTE → WORKER_ARRIVED →
 *   SERVICE_IN_PROGRESS → SERVICE_COMPLETED
 *
 *   Any active status → CANCELLED (by customer)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "sos_requests")
public class SOSRequest {

    @Id
    private String id;

    // ── Customer Info ──────────────────────────────────────────────────────
    @Indexed
    private String customerId;
    private String customerName;
    private String customerPhone;
    private String customerEmail;

    // ── Vehicle Info ───────────────────────────────────────────────────────
    private String vehicleNumber;
    private String vehicleType;
    private String vehicleBrand;
    private String vehicleModel;

    // ── Emergency Details ──────────────────────────────────────────────────
    /** ACCIDENT | VEHICLE_BREAKDOWN | FLAT_TYRE | BATTERY_DEAD | ENGINE_FAILURE | FUEL_EMPTY | SAFETY_CONCERN | OTHER */
    private String emergencyType;

    /** CANNOT_MOVE | MOVE_SLOWLY | OPERATIONAL */
    private String vehicleStatus;

    /** BLOCKING_TRAFFIC | NOT_BLOCKING */
    private String trafficImpact;

    /** INJURED | NO_INJURY */
    private String injuryStatus;

    private String additionalDescription;

    // ── Location ───────────────────────────────────────────────────────────
    private Double latitude;
    private Double longitude;
    private String address;

    // ── Priority ───────────────────────────────────────────────────────────
    private Integer priorityScore;
    /** NORMAL | HIGH | EMERGENCY */
    private String priorityLevel;

    // ── Broadcast: all nearby SCs were notified ─────────────────────────────
    /** IDs of all service centers that received this SOS broadcast */
    private List<String> notifiedServiceCenterIds;

    /** IDs of service centers that explicitly rejected this SOS */
    private List<String> rejectedServiceCenterIds;

    // ── Assignment ─────────────────────────────────────────────────────────
    @Indexed
    private String assignedServiceCenterId;
    private String assignedServiceCenterName;

    @Indexed
    private String assignedWorkerId;
    private String assignedWorkerName;
    private String assignedWorkerPhone;

    // ── Status ─────────────────────────────────────────────────────────────
    @Indexed
    private String status;

    // Reason provided when customer cancels
    private String cancellationReason;

    // ── Chat ──────────────────────────────────────────────────────────────
    /** Shared chat room ID for customer ↔ worker real-time messaging */
    private String chatRoomId;

    // ── Emergency Contacts (snapshot at time of SOS) ───────────────────────
    private List<EmergencyContact> emergencyContacts;

    // ── Timestamps ─────────────────────────────────────────────────────────
    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    private LocalDateTime workerAssignedAt;
    private LocalDateTime workerArrivedAt;
    private LocalDateTime serviceCompletedAt;

    // ── Nested ────────────────────────────────────────────────────────────
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmergencyContact {
        private String name;
        private String phone;
        private String relation;
    }
}
