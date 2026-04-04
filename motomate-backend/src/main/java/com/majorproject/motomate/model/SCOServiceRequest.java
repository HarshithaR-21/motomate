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

    private String serviceCenterId;   // assigned service center (owner userId)
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
    private Double totalPrice;
    private Integer totalDurationMinutes;

    // Scheduling
    private LocalDate scheduledDate;
    private LocalTime scheduledTime;
    private String urgency;           // NORMAL | URGENT | EMERGENCY

    // Address
    private String serviceMode;       // PICKUP | DROP_OFF | HOME_SERVICE
    private String address;

    // Assignment & status
    private String assignedWorkerId;
    private String assignedWorkerName;

    /**
     * PENDING → ACCEPTED → ASSIGNED → IN_PROGRESS → COMPLETED | CANCELLED
     */
    private String status;

    private String additionalNotes;
    private String cancellationReason;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}