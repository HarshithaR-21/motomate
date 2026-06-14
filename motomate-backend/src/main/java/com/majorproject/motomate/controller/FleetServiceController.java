package com.majorproject.motomate.controller;

import com.majorproject.motomate.dto.ApiResponse;
import com.majorproject.motomate.dto.FleetServiceDTOs.*;
import com.majorproject.motomate.model.ServiceCenterRating;
import com.majorproject.motomate.repository.ServiceCenterRatingRepository;
import com.majorproject.motomate.service.FleetServiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fleet/services")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175"},
             allowCredentials = "true")
public class FleetServiceController {

    private final FleetServiceService serviceService;
    private final ServiceCenterRatingRepository ratingRepo;

    // ── POST /api/fleet/services ─────────────────────────────────
    @PostMapping
    public ResponseEntity<ApiResponse<ServiceResponse>> scheduleService(
            @RequestHeader("X-Fleet-Manager-Id") String managerId,
            @Valid @RequestBody ServiceRequest req) {
        try {
            ServiceResponse resp = serviceService.scheduleService(managerId, req);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.<ServiceResponse>builder()
                            .success(true)
                            .message("Service scheduled successfully")
                            .data(resp)
                            .build());
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.<ServiceResponse>builder()
                            .success(false).message(ex.getMessage()).build());
        }
    }

    // ── POST /api/fleet/services/bulk ────────────────────────────
    @PostMapping("/bulk")
    public ResponseEntity<ApiResponse<BulkScheduleSummary>> bulkSchedule(
            @RequestHeader("X-Fleet-Manager-Id") String managerId,
            @Valid @RequestBody BulkServiceRequest req) {
        try {
            BulkScheduleSummary summary = serviceService.bulkSchedule(managerId, req);
            String msg = summary.getVehicleCount() + " services scheduled";
            if (summary.getDiscountPercent() > 0) {
                msg += " with " + summary.getDiscountPercent() + "% bulk discount (saved ₹"
                        + String.format("%.2f", summary.getDiscountAmount()) + ")";
            }
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.<BulkScheduleSummary>builder()
                            .success(true)
                            .message(msg)
                            .data(summary)
                            .build());
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.<BulkScheduleSummary>builder()
                            .success(false).message(ex.getMessage()).build());
        }
    }

    // ── GET /api/fleet/services ──────────────────────────────────
    @GetMapping
    public ResponseEntity<ApiResponse<List<ServiceResponse>>> getServices(
            @RequestHeader("X-Fleet-Manager-Id") String managerId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String vehicleId) {
        return ResponseEntity.ok(ApiResponse.<List<ServiceResponse>>builder()
                .success(true)
                .data(serviceService.getServices(managerId, status, vehicleId))
                .build());
    }

    // ── PATCH /api/fleet/services/{id}/status ────────────────────
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<ServiceResponse>> updateStatus(
            @PathVariable String id,
            @Valid @RequestBody StatusUpdateRequest req) {
        try {
            return ResponseEntity.ok(ApiResponse.<ServiceResponse>builder()
                    .success(true)
                    .message("Service status updated")
                    .data(serviceService.updateStatus(id, req))
                    .build());
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.<ServiceResponse>builder()
                            .success(false).message(ex.getMessage()).build());
        }
    }

    // ── POST /api/fleet/services/{id}/rate ───────────────────────
    /**
     * Fleet manager rates a service center after a completed booking.
     * Body: { serviceCenterId, serviceCenterName, managerId, managerName, rating (1-5), feedback? }
     * Internally persists to ServiceCenterRating collection (shared with customer ratings).
     */
    @PostMapping("/{id}/rate")
    public ResponseEntity<?> rateServiceCenter(
            @PathVariable String id,
            @RequestHeader("X-Fleet-Manager-Id") String managerId,
            @RequestBody Map<String, Object> body) {
        try {
            Object ratingObj = body.get("rating");
            if (ratingObj == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "rating (1-5) is required"));
            }
            int rating = ((Number) ratingObj).intValue();
            if (rating < 1 || rating > 5) {
                return ResponseEntity.badRequest().body(Map.of("error", "rating must be between 1 and 5"));
            }

            // Update FleetService record
            ServiceResponse updated = serviceService.rateServiceCenter(id,
                    rating, (String) body.getOrDefault("feedback", null));

            // Also persist to shared ServiceCenterRating collection
            // Check if booking already rated
            String bookingKey = "fleet_" + id;
            if (!ratingRepo.findByBookingId(bookingKey).isPresent()) {
                ratingRepo.save(ServiceCenterRating.builder()
                        .bookingId(bookingKey)
                        .serviceCenterId((String) body.getOrDefault("serviceCenterId", ""))
                        .serviceCenterName((String) body.getOrDefault("serviceCenterName", ""))
                        .customerId(managerId)
                        .customerName((String) body.getOrDefault("managerName", "Fleet Manager"))
                        .rating(rating)
                        .feedback((String) body.getOrDefault("feedback", null))
                        .createdAt(Instant.now())
                        .build());
            }

            return ResponseEntity.ok(ApiResponse.<ServiceResponse>builder()
                    .success(true)
                    .message("Rating submitted successfully")
                    .data(updated)
                    .build());

        } catch (IllegalStateException ex) {
            return ResponseEntity.status(409).body(Map.of("error", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of("error", ex.getMessage()));
        }
    }

    // ── GET /api/fleet/services/report ──────────────────────────
    @GetMapping("/report")
    public ResponseEntity<ApiResponse<MaintenanceReport>> getReport(
            @RequestHeader("X-Fleet-Manager-Id") String managerId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String vehicleId) {
        return ResponseEntity.ok(ApiResponse.<MaintenanceReport>builder()
                .success(true)
                .data(serviceService.getReport(managerId, from, to, vehicleId))
                .build());
    }
}
