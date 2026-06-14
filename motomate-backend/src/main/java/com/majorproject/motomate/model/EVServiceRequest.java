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
 * EV Service Request entity.
 * Tracks doorstep EV servicing from booking to completion.
 * Collection: ev_service_requests
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "ev_service_requests")
public class EVServiceRequest {

    @Id
    private String id;

    @Indexed
    private String customerId;

    private String vehicleId;            // References EVVehicle.id
    private String vehicleNumber;
    private String vehicleMake;
    private String vehicleModel;

    private String selectedWorkshopId;   // References EVWorkshop.id
    private String selectedWorkshopName;

    private String assignedWorkerId;     // References EVWorker.id
    private String assignedWorkerName;
    private String assignedWorkerPhone;

    private String serviceType;          // See EVServiceType enum values
    private List<String> serviceNames;
    private String description;

    private Double customerLatitude;
    private Double customerLongitude;
    private String customerAddress;

    private List<String> uploadedImagePaths;

    private Double distanceKm;           // distance from worker to customer at assignment

    @Builder.Default
    private String status = "REQUESTED";
    // REQUESTED | ASSIGNED | ACCEPTED | ON_THE_WAY | SERVICE_STARTED | COMPLETED | CANCELLED

    private String cancellationReason;

    private Double rating;
    private String review;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    private LocalDateTime assignedAt;
    private LocalDateTime completedAt;
    private Integer estimatedArrivalMinutes;
}