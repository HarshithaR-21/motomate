package com.majorproject.motomate.controller;

import com.majorproject.motomate.realtime.SseNotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

/**
 * REST Controller for Server-Sent Event (SSE) subscriptions.
 *
 * Frontend connects once:
 *   const es = new EventSource('/api/notifications/subscribe/{userId}', { withCredentials: true });
 *   es.addEventListener('worker_assigned', e => { ... });
 *   es.addEventListener('worker_assigned_to_customer', e => { ... });
 *   es.addEventListener('job_status_updated', e => { ... });
 */
@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class NotificationController {

    @Autowired
    private SseNotificationService sseService;

    /**
     * GET /api/notifications/subscribe/{userId}
     *
     * Opens a persistent SSE stream for the given userId.
     * The client must reconnect if the stream closes (browser does this automatically
     * for EventSource — it retries every 3 s by default).
     */
    @GetMapping(value = "/subscribe/{userId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(@PathVariable String userId) {
        return sseService.createEmitter(userId);
    }

    /**
     * GET /api/notifications/status
     * Simple health-check to see how many SSE connections are open.
     */
    @GetMapping("/status")
    public ResponseEntity<?> status() {
        return ResponseEntity.ok(Map.of(
                "activeConnections", sseService.activeConnections(),
                "service", "SseNotificationService",
                "status", "UP"
        ));
    }
}
