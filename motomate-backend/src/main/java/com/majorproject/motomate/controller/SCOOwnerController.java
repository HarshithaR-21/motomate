package com.majorproject.motomate.controller;

import com.majorproject.motomate.model.SCOService;
import com.majorproject.motomate.model.SCOServiceRequest;
import com.majorproject.motomate.model.SCOWorker;
import com.majorproject.motomate.service.SCOOwnerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST Controller for Service Center Owner module.
 * Base path: /api/sco
 */
@RestController
@RequestMapping("/api/sco")
public class SCOOwnerController {

    @Autowired
    private SCOOwnerService scoService;

    // ═══════════════════════════════════════════════════════════════
    //  DASHBOARD
    // ═══════════════════════════════════════════════════════════════

    @GetMapping("/{ownerId}/dashboard")
    public ResponseEntity<?> getDashboard(@PathVariable String ownerId) {
        try {
            return ResponseEntity.ok(scoService.getDashboardStats(ownerId));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // ═══════════════════════════════════════════════════════════════
    //  PROFILE
    // ═══════════════════════════════════════════════════════════════

    @GetMapping("/{ownerId}/profile")
    public ResponseEntity<?> getProfile(@PathVariable String ownerId) {
        try {
            return scoService.getProfile(ownerId)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // ═══════════════════════════════════════════════════════════════
    //  SERVICE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════

    @GetMapping("/{ownerId}/services")
    public ResponseEntity<?> listServices(@PathVariable String ownerId) {
        try {
            return ResponseEntity.ok(scoService.listServices(ownerId));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{ownerId}/services")
    public ResponseEntity<?> createService(@PathVariable String ownerId,
                                           @RequestBody SCOService svc) {
        try {
            return ResponseEntity.ok(scoService.createService(ownerId, svc));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{ownerId}/services/{serviceId}")
    public ResponseEntity<?> updateService(@PathVariable String ownerId,
                                           @PathVariable String serviceId,
                                           @RequestBody SCOService svc) {
        try {
            return ResponseEntity.ok(scoService.updateService(ownerId, serviceId, svc));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{ownerId}/services/{serviceId}")
    public ResponseEntity<?> deleteService(@PathVariable String ownerId,
                                           @PathVariable String serviceId) {
        try {
            scoService.deleteService(ownerId, serviceId);
            return ResponseEntity.ok(Map.of("message", "Service deleted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ═══════════════════════════════════════════════════════════════
    //  WORKER MANAGEMENT
    // ═══════════════════════════════════════════════════════════════

    @GetMapping("/{ownerId}/workers")
    public ResponseEntity<?> listWorkers(@PathVariable String ownerId,
                                         @RequestParam(required = false) String role,
                                         @RequestParam(required = false) String availability) {
        try {
            return ResponseEntity.ok(scoService.listWorkers(ownerId, role, availability));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/sco/{ownerId}/workers
     *
     * Accepts a flat JSON body that includes all SCOWorker fields PLUS an
     * optional "workerPassword" field.  Spring deserialises the known SCOWorker
     * fields automatically; we pull out workerPassword separately so it is
     * never stored on the worker document itself.
     *
     * Example body:
     * {
     *   "name": "Ravi Kumar",
     *   "phone": "9876543210",
     *   "email": "ravi@example.com",
     *   "role": "MECHANIC",
     *   "availability": "AVAILABLE",
     *   "skills": ["ENGINE", "BRAKES"],
     *   "workerPassword": "secret123"   ← optional
     * }
     */
    @PostMapping("/{ownerId}/workers")
    public ResponseEntity<?> addWorker(@PathVariable String ownerId,
                                       @RequestBody Map<String, Object> body) {
        try {
            // Extract the optional password before handing off to service
            String workerPassword = (String) body.get("workerPassword");

            // Map the remaining fields onto SCOWorker manually
            // (avoids needing a separate DTO class)
            SCOWorker worker = new SCOWorker();
            worker.setName((String) body.get("name"));
            worker.setPhone((String) body.get("phone"));
            worker.setEmail((String) body.get("email"));
            worker.setRole((String) body.get("role"));
            worker.setAvailability((String) body.getOrDefault("availability", "AVAILABLE"));

            @SuppressWarnings("unchecked")
            java.util.List<String> skills = (java.util.List<String>) body.get("skills");
            worker.setSkills(skills != null ? skills : new java.util.ArrayList<>());

            return ResponseEntity.ok(scoService.addWorker(ownerId, worker, workerPassword));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{ownerId}/workers/{workerId}")
    public ResponseEntity<?> updateWorker(@PathVariable String ownerId,
                                          @PathVariable String workerId,
                                          @RequestBody SCOWorker worker) {
        try {
            return ResponseEntity.ok(scoService.updateWorker(ownerId, workerId, worker));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{ownerId}/workers/{workerId}/toggle-availability")
    public ResponseEntity<?> toggleAvailability(@PathVariable String ownerId,
                                                @PathVariable String workerId) {
        try {
            return ResponseEntity.ok(scoService.toggleWorkerAvailability(ownerId, workerId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{ownerId}/workers/{workerId}")
    public ResponseEntity<?> deleteWorker(@PathVariable String ownerId,
                                          @PathVariable String workerId) {
        try {
            scoService.deleteWorker(ownerId, workerId);
            return ResponseEntity.ok(Map.of("message", "Worker removed"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ═══════════════════════════════════════════════════════════════
    //  SERVICE REQUESTS
    // ═══════════════════════════════════════════════════════════════

    @GetMapping("/{ownerId}/requests")
    public ResponseEntity<?> listRequests(@PathVariable String ownerId,
                                          @RequestParam(required = false) String status) {
        try {
            return ResponseEntity.ok(scoService.listRequests(ownerId, status));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{ownerId}/requests/{requestId}")
    public ResponseEntity<?> getRequest(@PathVariable String ownerId,
                                        @PathVariable String requestId) {
        try {
            return ResponseEntity.ok(scoService.getRequest(requestId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{ownerId}/requests/{requestId}/accept")
    public ResponseEntity<?> acceptRequest(@PathVariable String ownerId,
                                           @PathVariable String requestId) {
        try {
            return ResponseEntity.ok(scoService.acceptRequest(ownerId, requestId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{ownerId}/requests/{requestId}/assign")
    public ResponseEntity<?> assignWorker(@PathVariable String ownerId,
                                          @PathVariable String requestId,
                                          @RequestBody Map<String, String> body) {
        try {
            String workerId = body.get("workerId");
            if (workerId == null || workerId.isBlank())
                return ResponseEntity.badRequest().body(Map.of("error", "workerId is required"));
            return ResponseEntity.ok(scoService.assignWorker(ownerId, requestId, workerId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{ownerId}/requests/{requestId}/complete")
    public ResponseEntity<?> completeRequest(@PathVariable String ownerId,
                                             @PathVariable String requestId) {
        try {
            return ResponseEntity.ok(scoService.completeRequest(ownerId, requestId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{ownerId}/requests/{requestId}/status")
    public ResponseEntity<?> updateStatus(@PathVariable String ownerId,
                                          @PathVariable String requestId,
                                          @RequestBody Map<String, String> body) {
        try {
            String status = body.get("status");
            if (status == null || status.isBlank())
                return ResponseEntity.badRequest().body(Map.of("error", "status is required"));
            return ResponseEntity.ok(scoService.updateRequestStatus(ownerId, requestId, status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/requests")
    public ResponseEntity<?> createRequest(@RequestBody SCOServiceRequest request) {
        try {
            return ResponseEntity.ok(scoService.createRequest(request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}