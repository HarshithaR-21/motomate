package com.majorproject.motomate.service;

import com.majorproject.motomate.model.ChatMessage;
import com.majorproject.motomate.repository.ChatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRepository chatRepository;

    public List<ChatMessage> getMessages(String bookingId) {
        return chatRepository.findByBookingIdOrderByTimestampAsc(bookingId);
    }

    public ChatMessage sendMessage(String bookingId, String senderRole, String senderName, String content) {
        ChatMessage msg = ChatMessage.builder()
                .bookingId(bookingId)
                .senderRole(senderRole)
                .senderName(senderName)
                .content(content)
                .timestamp(Instant.now())
                // sender automatically "reads" their own message
                .readByCustomer("CUSTOMER".equals(senderRole))
                .readByWorker("WORKER".equals(senderRole))
                .build();
        return chatRepository.save(msg);
    }

    public int unreadCount(String bookingId, String readerRole) {
        if ("CUSTOMER".equals(readerRole)) {
            return chatRepository
                    .findByBookingIdAndSenderRoleNotAndReadByCustomerFalse(bookingId, "CUSTOMER")
                    .size();
        } else {
            return chatRepository
                    .findByBookingIdAndSenderRoleNotAndReadByWorkerFalse(bookingId, "WORKER")
                    .size();
        }
    }

    public void markRead(String bookingId, String readerRole) {
        List<ChatMessage> unread;
        if ("CUSTOMER".equals(readerRole)) {
            unread = chatRepository.findByBookingIdAndSenderRoleNotAndReadByCustomerFalse(bookingId, "CUSTOMER");
            unread.forEach(m -> m.setReadByCustomer(true));
        } else {
            unread = chatRepository.findByBookingIdAndSenderRoleNotAndReadByWorkerFalse(bookingId, "WORKER");
            unread.forEach(m -> m.setReadByWorker(true));
        }
        chatRepository.saveAll(unread);
    }
}
