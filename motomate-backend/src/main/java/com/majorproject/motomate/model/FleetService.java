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

    private String serviceType;       // OIL_CHANGE, REPAIR, FULL_SERVICE, TIRE_CHANGE, INSPECTION
    private String serviceCenter;
    private String serviceCenterId;

    private String assignedWorker;
    private String assignedWorkerId;

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

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
