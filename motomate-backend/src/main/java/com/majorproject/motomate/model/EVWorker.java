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
 * EV Worker entity.
 * A technician who belongs to exactly one EV workshop.
 * Collection: ev_workers
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "ev_workers")
public class EVWorker {

    @Id
    private String id;

    @Indexed
    private String workshopId;        // References EVWorkshop.id — MANDATORY

    /** If credentials were created, references UserModel.id so the worker can log in. */
    private String workerUserId;

    private String name;
    private String phone;
    private String email;
    private String specialization;   // e.g. BATTERY, CHARGING_SYSTEM, MOTOR, GENERAL

    @Builder.Default
    private boolean evCertified = true;

    @Builder.Default
    private boolean batterySpecialist = false;

    @Builder.Default
    private boolean chargingSpecialist = false;

    private Double currentLatitude;
    private Double currentLongitude;

    @Builder.Default
    private String availabilityStatus = "AVAILABLE";  // AVAILABLE | ASSIGNED | OFF_DUTY

    private List<String> skills;
    private Integer completedJobs;
    private Double rating;

    @Builder.Default
    private boolean active = true;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}