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
 *
 * All endpoints expect the SCO's userId passed as a path variable or
 * extracted from the JWT token. Using path variable here for simplicity
 * to align with existing pattern in the project.
 */
@RestController
@RequestMapping("/api/sco")
public class SCOOwnerController {

    @Autowired
    private SCOOwnerService scoService;

    // ═══════════════════════════════════════════════════════════════
    //  DASHBOARD
    // ═══════════════════════════════════════════════════════════════

    /** GET /api/sco/{ownerId}/dashboard */
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

    /** GET /api/sco/{ownerId}/profile */
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

    /** GET /api/sco/{ownerId}/services */
    @GetMapping("/{ownerId}/services")
    public ResponseEntity<?> listServices(@PathVariable String ownerId) {
        try {
            return ResponseEntity.ok(scoService.listServices(ownerId));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /** POST /api/sco/{ownerId}/services */
    @PostMapping("/{ownerId}/services")
    public ResponseEntity<?> createService(@PathVariable String ownerId,
                                           @RequestBody SCOService svc) {
        try {
            return ResponseEntity.ok(scoService.createService(ownerId, svc));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** PUT /api/sco/{ownerId}/services/{serviceId} */
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

    /** DELETE /api/sco/{ownerId}/services/{serviceId} */
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

    /** GET /api/sco/{ownerId}/workers?role=&availability= */
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

    /** POST /api/sco/{ownerId}/workers */
    @PostMapping("/{ownerId}/workers")
    public ResponseEntity<?> addWorker(@PathVariable String ownerId,
                                       @RequestBody SCOWorker worker) {
        try {
            return ResponseEntity.ok(scoService.addWorker(ownerId, worker));
        } catch (Exception e) {
            e.printStackTrace(); // prints full stack to console
        return ResponseEntity.status(500).body(e.getMessage());
        }
    }

    /** PUT /api/sco/{ownerId}/workers/{workerId} */
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

    /** PATCH /api/sco/{ownerId}/workers/{workerId}/toggle-availability */
    @PatchMapping("/{ownerId}/workers/{workerId}/toggle-availability")
    public ResponseEntity<?> toggleAvailability(@PathVariable String ownerId,
                                                @PathVariable String workerId) {
        try {
            return ResponseEntity.ok(scoService.toggleWorkerAvailability(ownerId, workerId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** DELETE /api/sco/{ownerId}/workers/{workerId} */
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

    /** GET /api/sco/{ownerId}/requests?status= */
    @GetMapping("/{ownerId}/requests")
    public ResponseEntity<?> listRequests(@PathVariable String ownerId,
                                          @RequestParam(required = false) String status) {
        try {
            return ResponseEntity.ok(scoService.listRequests(ownerId, status));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /** GET /api/sco/{ownerId}/requests/{requestId} */
    @GetMapping("/{ownerId}/requests/{requestId}")
    public ResponseEntity<?> getRequest(@PathVariable String ownerId,
                                        @PathVariable String requestId) {
        try {
            return ResponseEntity.ok(scoService.getRequest(requestId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** PATCH /api/sco/{ownerId}/requests/{requestId}/accept */
    @PatchMapping("/{ownerId}/requests/{requestId}/accept")
    public ResponseEntity<?> acceptRequest(@PathVariable String ownerId,
                                           @PathVariable String requestId) {
        try {
            return ResponseEntity.ok(scoService.acceptRequest(ownerId, requestId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** PATCH /api/sco/{ownerId}/requests/{requestId}/assign  Body: { "workerId": "..." } */
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

    /** PATCH /api/sco/{ownerId}/requests/{requestId}/complete */
    @PatchMapping("/{ownerId}/requests/{requestId}/complete")
    public ResponseEntity<?> completeRequest(@PathVariable String ownerId,
                                             @PathVariable String requestId) {
        try {
            return ResponseEntity.ok(scoService.completeRequest(ownerId, requestId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** PATCH /api/sco/{ownerId}/requests/{requestId}/status  Body: { "status": "..." } */
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

    /** POST /api/sco/requests  (for seeding/testing) */
    @PostMapping("/requests")
    public ResponseEntity<?> createRequest(@RequestBody SCOServiceRequest request) {
        try {
            return ResponseEntity.ok(scoService.createRequest(request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}