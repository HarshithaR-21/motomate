package com.majorproject.motomate.controller;

import com.majorproject.motomate.dto.EVDTOs;
import com.majorproject.motomate.model.EVServiceRequest;
import com.majorproject.motomate.model.EVVehicle;
import com.majorproject.motomate.model.EVWorkshop;
import com.majorproject.motomate.model.UserModel;
import com.majorproject.motomate.service.EVService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ev")
@CrossOrigin(
        origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175"},
        allowCredentials = "true"
)
public class EVController {

    @Autowired
    private EVService evService;

    @PostMapping("/vehicles")
    public ResponseEntity<?> createVehicle(@Valid @RequestBody EVDTOs.EVVehicleRequest request) {
        try {
            String userId = getCurrentUserId();
            EVVehicle vehicle = evService.createVehicle(request, userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(vehicle);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/vehicles")
    public ResponseEntity<?> getMyVehicles() {
        try {
            String userId = getCurrentUserId();
            return ResponseEntity.ok(evService.getVehicles(userId));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", ex.getMessage()));
        }
    }

    @PatchMapping("/vehicles/{id}/battery")
    public ResponseEntity<?> updateBattery(
            @PathVariable String id,
            @RequestParam Double percentage) {
        try {
            String userId = getCurrentUserId();
            return ResponseEntity.ok(evService.updateBattery(id, userId, percentage));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @DeleteMapping("/vehicles/{id}")
    public ResponseEntity<?> deleteVehicle(@PathVariable String id) {
        try {
            String userId = getCurrentUserId();
            evService.deleteVehicle(id, userId);
            return ResponseEntity.ok(Map.of("message", "Vehicle deleted"));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/workshops")
    public ResponseEntity<?> listWorkshops() {
        return ResponseEntity.ok(evService.getWorkshops());
    }

    @GetMapping("/workshops/nearby")
    public ResponseEntity<?> listNearbyWorkshops(
            @RequestParam Double lat,
            @RequestParam Double lng) {
        return ResponseEntity.ok(evService.getNearbyWorkshops(lat, lng));
    }

    @GetMapping("/workshops/{id}")
    public ResponseEntity<?> getWorkshop(@PathVariable String id) {
        try {
            return ResponseEntity.ok(evService.getWorkshopById(id));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/book-service")
    public ResponseEntity<?> bookService(@Valid @RequestBody EVDTOs.EVBookServiceRequest request) {
        try {
            String userId = getCurrentUserId();
            EVServiceRequest created = evService.bookService(request, userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/service-history")
    public ResponseEntity<?> getServiceHistory() {
        try {
            String userId = getCurrentUserId();
            return ResponseEntity.ok(evService.getServiceHistory(userId));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/service-requests/{id}")
    public ResponseEntity<?> getServiceRequest(@PathVariable String id) {
        try {
            String userId = getCurrentUserId();
            return ResponseEntity.ok(evService.getRequest(id, userId));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/service-requests/{id}/cancel")
    public ResponseEntity<?> cancelRequest(@PathVariable String id, @RequestBody Map<String, String> body) {
        try {
            String userId = getCurrentUserId();
            String reason = body.getOrDefault("reason", "Customer cancelled request");
            return ResponseEntity.ok(evService.cancelRequest(id, userId, reason));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/service-requests/{id}/rate")
    public ResponseEntity<?> rateRequest(@PathVariable String id, @RequestBody Map<String, Object> body) {
        try {
            String userId = getCurrentUserId();
            Double rating = body.get("rating") instanceof Number ? ((Number) body.get("rating")).doubleValue() : null;
            String review = (String) body.getOrDefault("review", null);
            if (rating == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Rating is required"));
            }
            return ResponseEntity.ok(evService.rateService(id, rating, review, userId));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/request-charging")
    public ResponseEntity<?> requestCharging(@Valid @RequestBody EVDTOs.EVChargingRequestDto request) {
        try {
            String userId = getCurrentUserId();
            return ResponseEntity.status(HttpStatus.CREATED).body(evService.createChargingRequest(request, userId));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/charging-history")
    public ResponseEntity<?> getChargingHistory() {
        try {
            String userId = getCurrentUserId();
            return ResponseEntity.ok(evService.getChargingHistory(userId));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/sos")
    public ResponseEntity<?> submitSOS(@RequestBody Map<String, Object> body) {
        try {
            String userId = getCurrentUserId();
            return ResponseEntity.status(HttpStatus.CREATED).body(evService.createSOSRequest(body, userId));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    // ── EV Workshop (Service Center) endpoints ─────────────────────────────────

    @GetMapping("/workshop/{workshopId}/dashboard")
    public ResponseEntity<?> getWorkshopDashboard(@PathVariable String workshopId) {
        try {
            return ResponseEntity.ok(evService.getWorkshopStats(workshopId));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/workshop/{workshopId}/requests")
    public ResponseEntity<?> getWorkshopRequests(@PathVariable String workshopId) {
        try {
            return ResponseEntity.ok(evService.getWorkshopRequests(workshopId));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
        }
    }

    @PutMapping("/workshop/requests/{requestId}/status")
    public ResponseEntity<?> updateRequestStatus(
            @PathVariable String requestId,
            @Valid @RequestBody EVDTOs.StatusUpdateRequest body) {
        try {
            EVServiceRequest updated = evService.updateRequestStatus(requestId, body.getStatus(), body.getReason());
            return ResponseEntity.ok(updated);
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
        }
    }

    private String getCurrentUserId() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            throw new IllegalStateException("User is not authenticated");
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof UserModel) {
            return ((UserModel) principal).getId();
        }
        if (principal instanceof String) {
            return (String) principal;
        }
        throw new IllegalStateException("Unable to resolve current user");
    }
}
