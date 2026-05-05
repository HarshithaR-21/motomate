package com.majorproject.motomate.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * A customer's rating of a worker after a completed job.
 */
@Document(collection = "worker_ratings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkerRating {

    @Id
    private String id;

    @Indexed
    private String workerId;

    private String workerName;

    /** The CustomerServiceModel.id */
    @Indexed(unique = true)   // one rating per booking
    private String bookingId;

    private String customerName;
    private String vehicleNumber;

    /** 1-5 */
    private int rating;

    /** Optional written review */
    private String feedback;

    private Instant createdAt;
}
