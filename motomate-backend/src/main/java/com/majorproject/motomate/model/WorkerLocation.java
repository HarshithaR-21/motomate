package com.majorproject.motomate.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Stores the live GPS location of a worker.
 * One document per worker (upserted on each location update).
 *
 * Collection: worker_locations
 *
 * Design notes:
 *  - Separate from SCOWorker so location updates are high-frequency writes
 *    that don't touch the main worker document.
 *  - workerId is a unique index so upsert is O(log n).
 *  - isActive flag lets the nearest-worker query exclude stale entries.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "worker_locations")
public class WorkerLocation {

    @Id
    private String id;

    /** References SCOWorker.id */
    @Indexed(unique = true)
    private String workerId;

    /** References SCOWorker.serviceCenterId (owner userId) */
    private String serviceCenterId;

    private Double latitude;
    private Double longitude;

    /**
     * Whether the worker is actively sharing location.
     * Set to false when the worker goes OFF_DUTY or the job is completed.
     */
    @Builder.Default
    private boolean active = true;

    @LastModifiedDate
    private LocalDateTime lastUpdatedAt;
}
