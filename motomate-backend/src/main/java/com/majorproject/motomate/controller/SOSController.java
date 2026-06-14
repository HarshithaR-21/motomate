package com.majorproject.motomate.controller;

import com.majorproject.motomate.dto.SOSDTOs;
import com.majorproject.motomate.model.CustomerEmergencyContacts;
import com.majorproject.motomate.service.SOSService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sos")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class SOSController {

    @Autowired
    private SOSService sosService;

    // ── Customer: submit new SOS ───────────────────────────────────────────────
    @PostMapping("/submit")
    public ResponseEntity<?> submitSOS(@Valid @RequestBody SOSDTOs.SOSCreateRequest req) {
        try {
            SOSDTOs.SOSResponse resp = sosService.submitSOS(req);
            return ResponseEntity.ok(resp);
        } catch (IllegalStateException ex) {
            String msg = ex.getMessage();
            if (msg != null && msg.startsWith("ACTIVE_SOS_EXISTS:")) {
                String existingId = msg.replace("ACTIVE_SOS_EXISTS:", "");
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of(
                                "error",      "ACTIVE_SOS_EXISTS",
                                "message",    "You already have an active SOS request",
                                "existingSosId", existingId));
            }
            return ResponseEntity.badRequest().body(Map.of("error", msg));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to submit SOS: " + ex.getMessage()));
        }
    }

    // ── Get SOS by ID ─────────────────────────────────────────────────────────
    @GetMapping("/{sosId}")
    public ResponseEntity<?> getById(@PathVariable String sosId) {
        try {
            return ResponseEntity.ok(sosService.getById(sosId));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", ex.getMessage()));
        }
    }

    // ── Customer: SOS history ─────────────────────────────────────────────────
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<SOSDTOs.SOSResponse>> getByCustomer(
            @PathVariable String customerId) {
        return ResponseEntity.ok(sosService.getByCustomer(customerId));
    }

    // ── Customer: cancel SOS ─────────────────────────────────────────────────
    @PostMapping("/{sosId}/cancel")
    public ResponseEntity<?> cancelSOS(
            @PathVariable String sosId,
            @Valid @RequestBody SOSDTOs.SOSCancelRequest req) {
        try {
            return ResponseEntity.ok(sosService.cancelSOS(sosId, req.customerId, req.reason));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", ex.getMessage()));
        }
    }

    // ── SCO: Get all incoming SOS for this service center (pending + accepted) ─
    @GetMapping("/service-center/{serviceCenterId}/incoming")
    public ResponseEntity<List<SOSDTOs.SOSResponse>> getIncomingForServiceCenter(
            @PathVariable String serviceCenterId) {
        return ResponseEntity.ok(sosService.getIncomingForServiceCenter(serviceCenterId));
    }

    // ── SCO: Accept SOS request ───────────────────────────────────────────────
    @PostMapping("/{sosId}/accept")
    public ResponseEntity<?> acceptSOS(
            @PathVariable String sosId,
            @Valid @RequestBody SOSDTOs.SOSAcceptRequest req) {
        try {
            return ResponseEntity.ok(sosService.acceptSOS(sosId, req.serviceCenterId));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to accept SOS: " + ex.getMessage()));
        }
    }

    // ── SCO: Reject SOS request ───────────────────────────────────────────────
    @PostMapping("/{sosId}/reject")
    public ResponseEntity<?> rejectSOS(
            @PathVariable String sosId,
            @Valid @RequestBody SOSDTOs.SOSRejectRequest req) {
        try {
            return ResponseEntity.ok(sosService.rejectSOS(sosId, req.serviceCenterId, req.reason));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to reject SOS: " + ex.getMessage()));
        }
    }

    // ── SCO: Manually assign a worker ─────────────────────────────────────────
    @PostMapping("/{sosId}/assign-worker")
    public ResponseEntity<?> manuallyAssignWorker(
            @PathVariable String sosId,
            @Valid @RequestBody SOSDTOs.ManualWorkerAssignRequest req) {
        try {
            return ResponseEntity.ok(sosService.manuallyAssignWorker(sosId, req.workerId));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to assign worker: " + ex.getMessage()));
        }
    }

    // ── SCO: Get available workers for an SOS ────────────────────────────────
    @GetMapping("/{sosId}/available-workers")
    public ResponseEntity<List<SOSDTOs.AvailableWorkerDTO>> getAvailableWorkers(
            @PathVariable String sosId,
            @RequestParam String serviceCenterId) {
        try {
            SOSDTOs.SOSResponse sos = sosService.getById(sosId);
            return ResponseEntity.ok(
                    sosService.getAvailableWorkersForSOS(
                            serviceCenterId, sos.latitude, sos.longitude));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ── Worker: update SOS status ─────────────────────────────────────────────
    @PutMapping("/{sosId}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable String sosId,
            @Valid @RequestBody SOSDTOs.SOSStatusUpdateRequest req) {
        try {
            return ResponseEntity.ok(
                    sosService.updateStatus(sosId, req.status, req.workerId));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", ex.getMessage()));
        }
    }

    // ── Worker: active SOS ────────────────────────────────────────────────────
    @GetMapping("/worker/{workerId}/active")
    public ResponseEntity<List<SOSDTOs.SOSResponse>> getActiveForWorker(
            @PathVariable String workerId) {
        return ResponseEntity.ok(sosService.getActiveForWorker(workerId));
    }

    // ── Emergency Contacts ────────────────────────────────────────────────────
    @GetMapping("/emergency-contacts/{customerId}")
    public ResponseEntity<?> getEmergencyContacts(@PathVariable String customerId) {
        return ResponseEntity.ok(sosService.getEmergencyContacts(customerId));
    }

    @PostMapping("/emergency-contacts/{customerId}")
    public ResponseEntity<?> saveEmergencyContacts(
            @PathVariable String customerId,
            @RequestBody List<CustomerEmergencyContacts.EmergencyContact> contacts) {
        try {
            return ResponseEntity.ok(sosService.saveEmergencyContacts(customerId, contacts));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", ex.getMessage()));
        }
    }
}
