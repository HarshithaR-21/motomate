package com.majorproject.motomate.controller;

import com.majorproject.motomate.dto.WorkerDTOs.*;
import com.majorproject.motomate.model.SCOWorker;
import com.majorproject.motomate.repository.SCOWorkerRepository;
import com.majorproject.motomate.repository.WorkerServiceRequestRepository;
import com.majorproject.motomate.service.WorkerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

/**
 * REST Controller for Worker Dashboard module.
 * Base path: /api/worker
 */
@RestController
@RequestMapping("/api/worker")
@CrossOrigin(origins = "*")
public class WorkerController {

    private final WorkerServiceRequestRepository workerServiceRequestRepository;

    @Autowired
    private WorkerService workerService;

    @Autowired
    private SCOWorkerRepository scoWorkerRepository;

    WorkerController(WorkerServiceRequestRepository workerServiceRequestRepository) {
        this.workerServiceRequestRepository = workerServiceRequestRepository;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  WORKER PROFILE
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * GET /api/worker/by-user/{userId}
     *
     * Looks up the SCOWorker whose workerUserId matches the logged-in user's id.
     * This is used when a worker logs in — their UserModel.id is known from the
     * JWT, but we need the SCOWorker document to render their dashboard.
     */
    @GetMapping("/by-user/{userId}")
    public ResponseEntity<?> getWorkerByUserId(@PathVariable String userId) {
        Optional<SCOWorker> worker = scoWorkerRepository.findByWorkerUserId(userId);
        return worker
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/worker/{workerId}
     * Returns worker profile details by SCOWorker document id.
     */
    @GetMapping("/{workerId}")
    public ResponseEntity<?> getWorkerProfile(@PathVariable String workerId) {
        try {
            return workerService.getWorkerProfile(workerId)
                    .<ResponseEntity<?>>map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  AVAILABILITY STATUS
    // ═══════════════════════════════════════════════════════════════════════

    @GetMapping("/{workerId}/status")
    public ResponseEntity<?> getStatus(@PathVariable String workerId) {
        try {
            return ResponseEntity.ok(workerService.getStatus(workerId));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{workerId}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable String workerId,
            @RequestBody StatusUpdateRequest request) {
        try {
            return ResponseEntity.ok(workerService.updateStatus(workerId, request.getStatus()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  DASHBOARD STATS
    // ═══════════════════════════════════════════════════════════════════════

    @GetMapping("/{workerId}/stats")
    public ResponseEntity<?> getStats(@PathVariable String workerId) {
        try {
            return ResponseEntity.ok(workerService.getStats(workerId));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  INCOMING JOBS
    // ═══════════════════════════════════════════════════════════════════════

    @GetMapping("/{workerId}/incoming-jobs")
    public ResponseEntity<?> getIncomingJobs(@PathVariable String workerId) {
        try {
            return ResponseEntity.ok(workerService.getIncomingJobs(workerId));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{workerId}/job/{jobId}/accept")
    public ResponseEntity<?> acceptJob(
            @PathVariable String workerId,
            @PathVariable String jobId) {
        try {
            return ResponseEntity.ok(workerService.acceptJob(workerId, jobId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{workerId}/job/{jobId}/reject")
    public ResponseEntity<?> rejectJob(
            @PathVariable String workerId,
            @PathVariable String jobId,
            @RequestBody RejectJobRequest request) {
        try {
            return ResponseEntity.ok(workerService.rejectJob(workerId, jobId, request.getReason()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  CURRENT JOB
    // ═══════════════════════════════════════════════════════════════════════

    @GetMapping("/{workerId}/current-job")
    public ResponseEntity<?> getCurrentJob(@PathVariable String workerId) {
        try {
            return workerService.getCurrentJob(workerId)
                    .<ResponseEntity<?>>map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{workerId}/job/{jobId}/status")
    public ResponseEntity<?> updateJobStatus(
            @PathVariable String workerId,
            @PathVariable String jobId,
            @RequestBody JobStatusUpdateRequest request) {
        try {
            return ResponseEntity.ok(workerService.updateJobStatus(workerId, jobId, request.getStatus()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  JOB HISTORY
    // ═══════════════════════════════════════════════════════════════════════

    @GetMapping("/{workerId}/job-history")
    public ResponseEntity<?> getJobHistory(
            @PathVariable String workerId,
            @RequestParam(required = false) String vehicleNumber,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            return ResponseEntity.ok(
                    workerService.getJobHistory(workerId, vehicleNumber, from, to, page, Math.min(size, 50))
            );
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  RATINGS
    // ═══════════════════════════════════════════════════════════════════════

    @GetMapping("/{workerId}/ratings")
    public ResponseEntity<?> getRatings(@PathVariable String workerId) {
        try {
            return ResponseEntity.ok(workerService.getRatings(workerId));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }
}