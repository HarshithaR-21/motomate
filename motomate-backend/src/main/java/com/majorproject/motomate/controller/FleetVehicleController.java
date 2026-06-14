package com.majorproject.motomate.controller;

import com.majorproject.motomate.dto.ApiResponse;
import com.majorproject.motomate.dto.FleetVehicleDTOs.*;
import com.majorproject.motomate.service.FleetVehicleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fleet/vehicles")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FleetVehicleController {

    private final FleetVehicleService vehicleService;

    // ── POST /api/fleet/vehicles ─────────────────────────────────
    @PostMapping
    public ResponseEntity<ApiResponse<VehicleResponse>> addVehicle(
            @RequestHeader("X-Fleet-Manager-Id") String managerId,
            @Valid @RequestBody VehicleRequest req) {
        try {
            VehicleResponse response = vehicleService.addVehicle(managerId, req);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.<VehicleResponse>builder()
                            .success(true)
                            .message("Vehicle added successfully")
                            .data(response)
                            .build());
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.<VehicleResponse>builder()
                            .success(false)
                            .message(ex.getMessage())
                            .build());
        }
    }

    // ── GET /api/fleet/vehicles ─────────────────────────────────
    // Fix 6: Only returns vehicles belonging to the authenticated manager
    @GetMapping
    public ResponseEntity<ApiResponse<List<VehicleResponse>>> getVehicles(
            @RequestHeader("X-Fleet-Manager-Id") String managerId) {
        return ResponseEntity.ok(ApiResponse.<List<VehicleResponse>>builder()
                .success(true)
                .data(vehicleService.getVehicles(managerId))
                .build());
    }

    // ── GET /api/fleet/vehicles/{id} ─────────────────────────────
    // Fix 6: Verifies the vehicle belongs to the requesting manager
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<VehicleResponse>> getVehicle(
            @RequestHeader("X-Fleet-Manager-Id") String managerId,
            @PathVariable String id) {
        try {
            return ResponseEntity.ok(ApiResponse.<VehicleResponse>builder()
                    .success(true)
                    .data(vehicleService.getVehicleForManager(id, managerId))
                    .build());
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.<VehicleResponse>builder()
                            .success(false)
                            .message(ex.getMessage())
                            .build());
        }
    }

    // ── PUT /api/fleet/vehicles/{id} ─────────────────────────────
    // Fix 6: Ownership verified before update
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<VehicleResponse>> updateVehicle(
            @RequestHeader("X-Fleet-Manager-Id") String managerId,
            @PathVariable String id,
            @Valid @RequestBody VehicleRequest req) {
        try {
            return ResponseEntity.ok(ApiResponse.<VehicleResponse>builder()
                    .success(true)
                    .message("Vehicle updated successfully")
                    .data(vehicleService.updateVehicle(id, managerId, req))
                    .build());
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.<VehicleResponse>builder()
                            .success(false)
                            .message(ex.getMessage())
                            .build());
        }
    }

    // ── DELETE /api/fleet/vehicles/{id} ──────────────────────────
    // Fix 6: Ownership verified before deletion
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteVehicle(
            @RequestHeader("X-Fleet-Manager-Id") String managerId,
            @PathVariable String id) {
        try {
            vehicleService.deleteVehicle(id, managerId);
            return ResponseEntity.ok(ApiResponse.<Void>builder()
                    .success(true)
                    .message("Vehicle deleted successfully")
                    .build());
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.<Void>builder()
                            .success(false)
                            .message(ex.getMessage())
                            .build());
        }
    }

    // ── GET /api/fleet/vehicles/dashboard/stats ──────────────────
    @GetMapping("/dashboard/stats")
    public ResponseEntity<ApiResponse<FleetDashboardStats>> getDashboardStats(
            @RequestHeader("X-Fleet-Manager-Id") String managerId) {
        return ResponseEntity.ok(ApiResponse.<FleetDashboardStats>builder()
                .success(true)
                .data(vehicleService.getDashboardStats(managerId))
                .build());
    }
}
