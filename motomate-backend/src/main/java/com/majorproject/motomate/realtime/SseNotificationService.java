package com.majorproject.motomate.realtime;

import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Logger;

/**
 * Manages Server-Sent Event (SSE) connections and broadcasts real-time
 * notifications to workers and customers.
 *
 * Events emitted:
 *  - "connected"                   → connection confirmation
 *  - "worker_assigned"             → worker: new job assigned
 *  - "worker_assigned_to_customer" → customer: worker assigned
 *  - "job_status_updated"          → any: job status changed
 *  - "worker_location_update"      → customer: live worker GPS update  ← NEW
 */
@Service
public class SseNotificationService {

    private static final Logger log = Logger.getLogger(SseNotificationService.class.getName());

    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();

    // ── Connection Management ────────────────────────────────────────────────

    public SseEmitter createEmitter(String userId) {
        SseEmitter old = emitters.remove(userId);
        if (old != null) {
            try { old.complete(); } catch (Exception ignored) {}
        }

        SseEmitter emitter = new SseEmitter(30 * 60 * 1000L);

        emitter.onCompletion(() -> { emitters.remove(userId); log.info("SSE completed: " + userId); });
        emitter.onTimeout(()    -> { emitters.remove(userId); log.info("SSE timed out: " + userId); });
        emitter.onError(ex      -> {
            emitters.remove(userId);
            log.warning("SSE error for " + userId + ": " + ex.getMessage());
        });

        emitters.put(userId, emitter);
        log.info("SSE registered: " + userId + " | total: " + emitters.size());

        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data("{\"userId\":\"" + userId + "\",\"message\":\"SSE connected\"}"));
        } catch (IOException e) {
            emitters.remove(userId);
            emitter.completeWithError(e);
        }

        return emitter;
    }

    // ── Notification Helpers ─────────────────────────────────────────────────

    public void notifyWorker(String workerUserId, String workerId, String payload) {
        boolean sent = pushEvent(workerUserId, "worker_assigned", payload);
        if (!sent) pushEvent(workerId, "worker_assigned", payload);
    }

    public void notifyCustomer(String customerId, String payload) {
        pushEvent(customerId, "worker_assigned_to_customer", payload);
    }

    public void notifyJobStatusUpdate(String userId, String payload) {
        pushEvent(userId, "job_status_updated", payload);
    }

    /**
     * NEW — Pushes a live worker GPS location to the customer.
     * Event name: "worker_location_update"
     *
     * @param customerId customer's UserModel.id
     * @param payload    JSON with workerId, latitude, longitude, timestamp
     */
    public void sendWorkerLocationUpdate(String customerId, String payload) {
        pushEvent(customerId, "worker_location_update", payload);
    }

    // ── Internal ─────────────────────────────────────────────────────────────

    private boolean pushEvent(String userId, String eventName, String payload) {
        if (userId == null || userId.isBlank()) return false;

        SseEmitter emitter = emitters.get(userId);
        if (emitter == null) {
            log.fine("No active SSE for userId=" + userId + ", event=" + eventName + " skipped.");
            return false;
        }

        try {
            emitter.send(SseEmitter.event().name(eventName).data(payload));
            log.info("SSE [" + eventName + "] → userId=" + userId);
            return true;
        } catch (IOException e) {
            log.warning("SSE send failed for userId=" + userId + ": " + e.getMessage());
            emitters.remove(userId);
            try { emitter.completeWithError(e); } catch (Exception ignored) {}
            return false;
        }
    }

    public int activeConnections() { return emitters.size(); }
}
