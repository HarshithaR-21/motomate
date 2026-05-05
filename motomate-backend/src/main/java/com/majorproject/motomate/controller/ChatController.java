package com.majorproject.motomate.controller;

import com.majorproject.motomate.model.ChatMessage;
import com.majorproject.motomate.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST endpoints for in-app chat between customer and worker.
 *
 * GET  /api/chat/{bookingId}/messages        → list all messages for a booking
 * POST /api/chat/{bookingId}/messages        → send a message
 * GET  /api/chat/{bookingId}/messages/unread → count of unread messages for caller
 */
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173","http://localhost:5174","http://localhost:5175","http://localhost:3000"}, allowCredentials = "true")
public class ChatController {

    private final ChatService chatService;

    /** Get all messages for a booking (newest-last order). */
    @GetMapping("/{bookingId}/messages")
    public ResponseEntity<List<ChatMessage>> getMessages(@PathVariable String bookingId) {
        return ResponseEntity.ok(chatService.getMessages(bookingId));
    }

    /**
     * Send a message.
     * Body: { senderRole: "CUSTOMER"|"WORKER", senderName: "...", content: "..." }
     */
    @PostMapping("/{bookingId}/messages")
    public ResponseEntity<ChatMessage> sendMessage(
            @PathVariable String bookingId,
            @RequestBody Map<String, String> body) {

        ChatMessage saved = chatService.sendMessage(
                bookingId,
                body.get("senderRole"),
                body.get("senderName"),
                body.get("content")
        );
        return ResponseEntity.ok(saved);
    }

    /** Count of unread messages for the given role (CUSTOMER or WORKER). */
    @GetMapping("/{bookingId}/messages/unread")
    public ResponseEntity<Map<String, Integer>> unreadCount(
            @PathVariable String bookingId,
            @RequestParam String role) {
        int count = chatService.unreadCount(bookingId, role);
        return ResponseEntity.ok(Map.of("unread", count));
    }

    /** Mark messages as read for a role. */
    @PostMapping("/{bookingId}/messages/read")
    public ResponseEntity<Void> markRead(
            @PathVariable String bookingId,
            @RequestParam String role) {
        chatService.markRead(bookingId, role);
        return ResponseEntity.ok().build();
    }
}