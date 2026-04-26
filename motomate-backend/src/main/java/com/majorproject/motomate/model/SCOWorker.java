package com.majorproject.motomate.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

/**
 * A worker registered under a service center.
 * Collection: sco_workers
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "sco_workers")
public class SCOWorker {

    @Id
    private String id;

    private String serviceCenterId;   // owner's userId

    /**
     * If credentials were created for this worker, this holds
     * the corresponding UserModel.id so the worker can log in.
     * Null when no credentials were created.
     */
    private String workerUserId;

    private String name;
    private String phone;
    private String email;
    private String role;              // e.g. MECHANIC, FUEL_DELIVERY, ELECTRICIAN, GENERAL
    private String availability;      // AVAILABLE | BUSY | OFF_DUTY

    private List<String> skills;

    private Integer completedJobs;
    private Double  rating;

    @Builder.Default
    private boolean active = true;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}