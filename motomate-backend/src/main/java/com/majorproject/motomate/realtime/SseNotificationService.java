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
 * How it works:
 *  1. Client connects to GET /api/notifications/subscribe/{userId}
 *  2. Server stores the SseEmitter keyed by userId
 *  3. When a worker is assigned, SCOOwnerService calls notifyWorker() and notifyCustomer()
 *  4. The relevant emitter pushes the event — browser receives it instantly
 */
@Service
public class SseNotificationService {

    private static final Logger log = Logger.getLogger(SseNotificationService.class.getName());

    /** userId → SseEmitter  (one active connection per user) */
    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();

    // ── Connection Management ────────────────────────────────────────────────

    /**
     * Called by the SSE controller when a client opens a connection.
     * Timeout = 30 minutes; client should reconnect on disconnect.
     */
    public SseEmitter createEmitter(String userId) {
        // Remove any stale emitter for this user
        SseEmitter old = emitters.remove(userId);
        if (old != null) {
            try { old.complete(); } catch (Exception ignored) {}
        }

        SseEmitter emitter = new SseEmitter(30 * 60 * 1000L); // 30-min timeout

        emitter.onCompletion(() -> {
            emitters.remove(userId);
            log.info("SSE completed for user: " + userId);
        });
        emitter.onTimeout(() -> {
            emitters.remove(userId);
            log.info("SSE timed out for user: " + userId);
        });
        emitter.onError(ex -> {
            emitters.remove(userId);
            log.warning("SSE error for user " + userId + ": " + ex.getMessage());
        });

        emitters.put(userId, emitter);
        log.info("SSE registered for user: " + userId + " | active connections: " + emitters.size());

        // Send a connection-confirmation event so the client knows it's live
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

    /**
     * Notifies the assigned worker that a new job has been assigned.
     * The worker's userId (from UserModel) is used as the SSE key.
     *
     * @param workerUserId  the UserModel.id of the worker (may be null if worker has no login)
     * @param workerId      the SCOWorker.id (always present)
     * @param payload       JSON string with job details
     */
    public void notifyWorker(String workerUserId, String workerId, String payload) {
        // Try by UserModel id first; fallback to SCOWorker id
        boolean sent = pushEvent(workerUserId, "worker_assigned", payload);
        if (!sent) {
            pushEvent(workerId, "worker_assigned", payload);
        }
    }

    /**
     * Notifies the customer that a worker has been assigned to their booking.
     *
     * @param customerId  the customer's userId (from UserModel)
     * @param payload     JSON string with worker details
     */
    public void notifyCustomer(String customerId, String payload) {
        pushEvent(customerId, "worker_assigned_to_customer", payload);
    }

    /**
     * Generic broadcast — notifies a user about any job status change.
     * event name = "job_status_updated"
     */
    public void notifyJobStatusUpdate(String userId, String payload) {
        pushEvent(userId, "job_status_updated", payload);
    }

    // ── Internal ─────────────────────────────────────────────────────────────

    /**
     * Pushes one SSE event to the emitter registered for userId.
     * Silently removes dead emitters.
     *
     * @return true if the event was sent, false if no active emitter found
     */
    private boolean pushEvent(String userId, String eventName, String payload) {
        if (userId == null || userId.isBlank()) return false;

        SseEmitter emitter = emitters.get(userId);
        if (emitter == null) {
            log.fine("No active SSE for userId=" + userId + ", event=" + eventName + " skipped.");
            return false;
        }

        try {
            emitter.send(SseEmitter.event()
                    .name(eventName)
                    .data(payload));
            log.info("SSE [" + eventName + "] sent to userId=" + userId);
            return true;
        } catch (IOException e) {
            log.warning("SSE send failed for userId=" + userId + ": " + e.getMessage());
            emitters.remove(userId);
            try { emitter.completeWithError(e); } catch (Exception ignored) {}
            return false;
        }
    }

    /** Diagnostic: how many active SSE connections are open */
    public int activeConnections() {
        return emitters.size();
    }
}
