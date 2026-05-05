package com.majorproject.motomate.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * Service request routed to a specific service center.
 * Collection: sco_service_requests
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "sco_service_requests")
public class SCOServiceRequest {

    @Id
    private String id;

    private String serviceCenterId;
    private String customerId;
    private String customerName;
    private String customerPhone;
    private String customerEmail;

    // Vehicle info
    private String vehicleType;
    private String brand;
    private String vehicleModel;
    private String fuelType;
    private String vehicleNumber;

    // Services requested
    private List<String> serviceNames;
    private Double  totalPrice;
    private Integer totalDurationMinutes;

    // Scheduling
    private LocalDate scheduledDate;
    private LocalTime scheduledTime;
    private String urgency;

    // Address & mode
    private String serviceMode;
    private String address;

    // Customer GPS coordinates (Doorstep service)
    private Double customerLatitude;
    private Double customerLongitude;

    // Assignment & status
    private String assignedWorkerId;
    private String assignedWorkerName;

    /**
     * PENDING → ACCEPTED → ASSIGNED → IN_PROGRESS → COMPLETED | CANCELLED
     */
    private String status;

    private String additionalNotes;
    private String cancellationReason;

    // ── Customer rating (added for rating system) ─────────────────────────────
    /** 1–5 stars from the customer. Null until rated. */
    private Double  customerRating;

    /** Optional written review from the customer. */
    private String  customerFeedback;

    /**
     * True once the customer has submitted a rating.
     * Prevents duplicate ratings. Default false (safe for existing documents).
     */
    @Builder.Default
    private boolean rated = false;
    // ─────────────────────────────────────────────────────────────────────────

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}