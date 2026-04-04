package com.majorproject.motomate.controller;

import com.majorproject.motomate.dto.ApiResponse;
import com.majorproject.motomate.dto.FleetServiceDTOs.*;
import com.majorproject.motomate.service.FleetServiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/fleet/services")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FleetServiceController {

    private final FleetServiceService serviceService;

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
    public ResponseEntity<ApiResponse<List<ServiceResponse>>> bulkSchedule(
            @RequestHeader("X-Fleet-Manager-Id") String managerId,
            @Valid @RequestBody BulkServiceRequest req) {
        List<ServiceResponse> resp = serviceService.bulkSchedule(managerId, req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<List<ServiceResponse>>builder()
                        .success(true)
                        .message(resp.size() + " services scheduled successfully")
                        .data(resp)
                        .build());
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
