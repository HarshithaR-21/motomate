package com.majorproject.motomate.repository;

import com.majorproject.motomate.model.ChatMessage;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatRepository extends MongoRepository<ChatMessage, String> {

    /** All messages for a booking, oldest first. */
    List<ChatMessage> findByBookingIdOrderByTimestampAsc(String bookingId);

    /** Unread messages sent by the OTHER role (i.e. not yet read by this role). */
    List<ChatMessage> findByBookingIdAndSenderRoleNotAndReadByCustomerFalse(String bookingId, String senderRole);
    List<ChatMessage> findByBookingIdAndSenderRoleNotAndReadByWorkerFalse(String bookingId, String senderRole);
}
