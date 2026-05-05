package com.majorproject.motomate.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * A single chat message between a customer and a worker,
 * scoped to a specific booking (CustomerServiceModel id).
 */
@Document(collection = "chat_messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {

    @Id
    private String id;

    /** The CustomerServiceModel.id this message belongs to. */
    @Indexed
    private String bookingId;

    /** "CUSTOMER" or "WORKER" */
    private String senderRole;

    private String senderName;

    private String content;

    /** UTC timestamp of when the message was sent. */
    private Instant timestamp;

    /** Whether the OTHER party has read this message. */
    private boolean readByCustomer;
    private boolean readByWorker;
}
