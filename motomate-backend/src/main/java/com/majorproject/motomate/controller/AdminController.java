package com.majorproject.motomate.controller;

import com.majorproject.motomate.model.IssueModel;
import com.majorproject.motomate.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Admin REST Controller
 * Base path: /api/admin  (protected by ROLE_ADMIN via SecurityConfig)
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private AdminService adminService;

    // ═══════════════════════════════════════════════════════════════
    //  DASHBOARD
    // ═══════════════════════════════════════════════════════════════

    /** GET /api/admin/dashboard/stats */
    @GetMapping("/dashboard/stats")
    public ResponseEntity<?> getDashboardStats() {
        try {
            return ResponseEntity.ok(adminService.getDashboardStats());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // ═══════════════════════════════════════════════════════════════
    //  ANALYTICS
    // ═══════════════════════════════════════════════════════════════

    /** GET /api/admin/analytics */
    @GetMapping("/analytics")
    public ResponseEntity<?> getAnalytics() {
        try {
            return ResponseEntity.ok(adminService.getAnalyticsOverview());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // ═══════════════════════════════════════════════════════════════
    //  ISSUE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════

    /**
     * GET /api/admin/issues
     * Query params: status, category, search, page, size
     */
    @GetMapping("/issues")
    public ResponseEntity<?> getIssues(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        try {
            return ResponseEntity.ok(adminService.getIssues(status, category, search, page, size));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /** GET /api/admin/issues/{id} */
    @GetMapping("/issues/{id}")
    public ResponseEntity<?> getIssueById(@PathVariable String id) {
        try {
            return ResponseEntity.ok(adminService.getIssueById(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** POST /api/admin/issues/{id}/reply  Body: { "message": "..." } */
    @PostMapping("/issues/{id}/reply")
    public ResponseEntity<?> replyToIssue(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            Authentication auth
    ) {
        try {
            String message   = body.get("message");
            String adminName = auth != null ? auth.getName() : "Admin";
            if (message == null || message.isBlank())
                return ResponseEntity.badRequest().body(Map.of("error", "Message cannot be empty"));
            return ResponseEntity.ok(adminService.replyToIssue(id, message, adminName));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** PATCH /api/admin/issues/{id}/status  Body: { "status": "RESOLVED" } */
    @PatchMapping("/issues/{id}/status")
    public ResponseEntity<?> updateIssueStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            Authentication auth
    ) {
        try {
            String status  = body.get("status");
            String adminId = auth != null ? auth.getName() : "admin";
            if (status == null || status.isBlank())
                return ResponseEntity.badRequest().body(Map.of("error", "Status is required"));
            return ResponseEntity.ok(adminService.updateIssueStatus(id, status, adminId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** POST /api/admin/issues  – create issue (e.g. from admin side) */
    @PostMapping("/issues")
    public ResponseEntity<?> createIssue(@RequestBody IssueModel issue) {
        try {
            return ResponseEntity.ok(adminService.createIssue(issue));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ═══════════════════════════════════════════════════════════════
    //  VERIFICATION MODULE
    // ═══════════════════════════════════════════════════════════════

    // ── Service Centers ──────────────────────────────────────────

    /**
     * GET /api/admin/verifications/service-centers
     * Query: status, search, page, size
     */
    @GetMapping("/verifications/service-centers")
    public ResponseEntity<?> getServiceCenterVerifications(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        try {
            return ResponseEntity.ok(adminService.getServiceCenterRequests(status, search, page, size));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /** GET /api/admin/verifications/service-centers/{id} */
    @GetMapping("/verifications/service-centers/{id}")
    public ResponseEntity<?> getServiceCenterDetail(@PathVariable String id) {
        try {
            return ResponseEntity.ok(adminService.getServiceCenterById(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * PATCH /api/admin/verifications/service-centers/{id}/approve
     * Body: { "remarks": "Looks good" }
     */
    @PatchMapping("/verifications/service-centers/{id}/approve")
    public ResponseEntity<?> approveServiceCenter(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> body
    ) {
        try {
            String remarks = body != null ? body.getOrDefault("remarks", "") : "";
            return ResponseEntity.ok(adminService.approveServiceCenter(id, remarks));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * PATCH /api/admin/verifications/service-centers/{id}/reject
     * Body: { "reason": "Documents incomplete" }
     */
    @PatchMapping("/verifications/service-centers/{id}/reject")
    public ResponseEntity<?> rejectServiceCenter(
            @PathVariable String id,
            @RequestBody Map<String, String> body
    ) {
        try {
            String reason = body.getOrDefault("reason", "Rejected by admin");
            return ResponseEntity.ok(adminService.rejectServiceCenter(id, reason));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Fleet Managers ───────────────────────────────────────────

    /**
     * GET /api/admin/verifications/fleet-managers
     * Query: status, search, industry, page, size
     */
    @GetMapping("/verifications/fleet-managers")
    public ResponseEntity<?> getFleetManagerVerifications(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String industry,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        try {
            return ResponseEntity.ok(adminService.getFleetManagerRequests(status, search, industry, page, size));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /** GET /api/admin/verifications/fleet-managers/{id} */
    @GetMapping("/verifications/fleet-managers/{id}")
    public ResponseEntity<?> getFleetManagerDetail(@PathVariable String id) {
        try {
            return ResponseEntity.ok(adminService.getFleetManagerById(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** PATCH /api/admin/verifications/fleet-managers/{id}/approve */
    @PatchMapping("/verifications/fleet-managers/{id}/approve")
    public ResponseEntity<?> approveFleetManager(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> body
    ) {
        try {
            String remarks = body != null ? body.getOrDefault("remarks", "") : "";
            return ResponseEntity.ok(adminService.approveFleetManager(id, remarks));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** PATCH /api/admin/verifications/fleet-managers/{id}/reject */
    @PatchMapping("/verifications/fleet-managers/{id}/reject")
    public ResponseEntity<?> rejectFleetManager(
            @PathVariable String id,
            @RequestBody Map<String, String> body
    ) {
        try {
            String reason = body.getOrDefault("reason", "Rejected by admin");
            return ResponseEntity.ok(adminService.rejectFleetManager(id, reason));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ═══════════════════════════════════════════════════════════════
    //  USER MANAGEMENT
    // ═══════════════════════════════════════════════════════════════

    /**
     * GET /api/admin/users
     * Query: role (CUSTOMER|WORKER|SERVICE_CENTER_OWNER|FLEET_MANAGER|ALL),
     *        search, activeOnly, page, size
     */
    @GetMapping("/users")
    public ResponseEntity<?> getUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "false") boolean activeOnly,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        try {
            return ResponseEntity.ok(adminService.getUsers(role, search, activeOnly, page, size));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /** GET /api/admin/users/{id} */
    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUserById(@PathVariable String id) {
        try {
            return ResponseEntity.ok(adminService.getUserById(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** PATCH /api/admin/users/{id}/deactivate */
    @PatchMapping("/users/{id}/deactivate")
    public ResponseEntity<?> deactivateUser(@PathVariable String id) {
        try {
            return ResponseEntity.ok(adminService.deactivateUser(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** PATCH /api/admin/users/{id}/reactivate */
    @PatchMapping("/users/{id}/reactivate")
    public ResponseEntity<?> reactivateUser(@PathVariable String id) {
        try {
            return ResponseEntity.ok(adminService.reactivateUser(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** DELETE /api/admin/users/{id} */
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable String id) {
        try {
            return ResponseEntity.ok(adminService.deleteUser(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ═══════════════════════════════════════════════════════════════
    //  SERVICE CENTERS DATA MODULE
    // ═══════════════════════════════════════════════════════════════

    /**
     * GET /api/admin/service-centers
     * Query: status, search, page, size
     */
    @GetMapping("/service-centers")
    public ResponseEntity<?> getAllServiceCenters(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        try {
            return ResponseEntity.ok(adminService.getAllServiceCenters(status, search, page, size));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /** GET /api/admin/service-centers/{id} */
    @GetMapping("/service-centers/{id}")
    public ResponseEntity<?> getServiceCenterDetails(@PathVariable String id) {
        try {
            return ResponseEntity.ok(adminService.getServiceCenterById(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ═══════════════════════════════════════════════════════════════
    //  FLEET MANAGERS DATA MODULE
    // ═══════════════════════════════════════════════════════════════

    /**
     * GET /api/admin/fleet-managers
     * Query: status, search, industry, page, size
     */
    @GetMapping("/fleet-managers")
    public ResponseEntity<?> getAllFleetManagers(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String industry,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        try {
            return ResponseEntity.ok(adminService.getAllFleetManagers(status, search, industry, page, size));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /** GET /api/admin/fleet-managers/{id} */
    @GetMapping("/fleet-managers/{id}")
    public ResponseEntity<?> getFleetManagerDetails(@PathVariable String id) {
        try {
            return ResponseEntity.ok(adminService.getFleetManagerById(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ═══════════════════════════════════════════════════════════════
    //  WORKERS DATA MODULE
    // ═══════════════════════════════════════════════════════════════

    /**
     * GET /api/admin/workers
     * Query: search, active, page, size
     */
    @GetMapping("/workers")
    public ResponseEntity<?> getWorkers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        try {
            return ResponseEntity.ok(adminService.getWorkers(search, active, page, size));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /** GET /api/admin/workers/{id} */
    @GetMapping("/workers/{id}")
    public ResponseEntity<?> getWorkerDetails(@PathVariable String id) {
        try {
            return ResponseEntity.ok(adminService.getUserById(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
