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

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "fleet_services")
public class FleetService {

    @Id
    private String id;

    private String vehicleId;
    private String vehicleNumber;
    private String fleetManagerId;

    // Legacy single type — kept for backward compat
    private String serviceType;

    // NEW: multi-service names selected by fleet manager (like customer flow)
    private List<String> selectedServiceNames;

    private String serviceCenter;
    private String serviceCenterId;

    private String assignedWorker;
    private String assignedWorkerId;

    // NEW: linked SCOServiceRequest so it appears on SCO dashboard
    private String scoRequestId;

    private LocalDate scheduledDate;
    private LocalTime scheduledTime;

    private Double estimatedCost;
    private Double actualCost;

    private String notes;

    // STATUS: PENDING, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED
    @Builder.Default
    private String status = "PENDING";

    private LocalDateTime completedAt;
    private String bulkBatchId;  // bulk schedule batch ID

    // Fix 9: Bulk discount fields — stored per service for transparent pricing
    private Integer discountPercent;
    private Double  discountAmount;
    private Double  finalCost;

    // NEW: Service center rating by fleet manager after completion
    @Builder.Default
    private boolean rated = false;
    private Integer serviceCenterRating;
    private String  serviceCenterFeedback;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
