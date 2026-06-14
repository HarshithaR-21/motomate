package com.majorproject.motomate.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * A customer's rating of a service center after a completed booking.
 */
@Document(collection = "service_center_ratings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceCenterRating {

    @Id
    private String id;

    /** The SCO owner's userId */
    @Indexed
    private String serviceCenterId;

    private String serviceCenterName;

    /** CustomerServiceModel.id — one rating per booking */
    @Indexed(unique = true)
    private String bookingId;

    private String customerId;
    private String customerName;

    /** 1–5 */
    private int rating;

    /** Optional written review */
    private String feedback;

    private Instant createdAt;
}
