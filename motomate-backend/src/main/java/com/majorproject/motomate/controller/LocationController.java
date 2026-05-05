package com.majorproject.motomate.controller;

import com.majorproject.motomate.dto.LocationDTOs;
import com.majorproject.motomate.model.CustomerServiceModel;
import com.majorproject.motomate.service.LocationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

/**
 * REST endpoints for the Maps / Location feature.
 *
 * Worker endpoints:
 *   PUT  /api/location/worker/{workerId}          — update live GPS
 *   GET  /api/location/worker/{workerId}           — get current location (SCO dashboard)
 *   PUT  /api/location/worker/{workerId}/deactivate — mark inactive (job done)
 *
 * Customer endpoints:
 *   PUT  /api/location/booking/{bookingId}/customer — store customer GPS on booking
 *   GET  /api/location/booking/{bookingId}/worker   — get worker's current position
 */
@RestController
@RequestMapping("/api/location")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175"}, allowCredentials = "true")
public class LocationController {

    @Autowired
    private LocationService locationService;

    // ── Worker: push live location ────────────────────────────────────────────

    /**
     * Worker frontend calls this every 5–10 seconds.
     *
     * Body: { "latitude": 12.9716, "longitude": 77.5946 }
     */
    @PutMapping("/worker/{workerId}")
    public ResponseEntity<LocationDTOs.WorkerLocationResponse> updateWorkerLocation(
            @PathVariable String workerId,
            @RequestBody LocationDTOs.WorkerLocationUpdateRequest req) {

        if (req.getLatitude() == null || req.getLongitude() == null) {
            return ResponseEntity.badRequest().build();
        }

        LocationDTOs.WorkerLocationResponse response =
                locationService.updateWorkerLocation(workerId, req.getLatitude(), req.getLongitude());

        return ResponseEntity.ok(response);
    }

    // ── Worker: get current location ──────────────────────────────────────────

    @GetMapping("/worker/{workerId}")
    public ResponseEntity<LocationDTOs.WorkerLocationResponse> getWorkerLocation(
            @PathVariable String workerId) {

        Optional<LocationDTOs.WorkerLocationResponse> loc = locationService.getWorkerLocation(workerId);
        return loc.map(ResponseEntity::ok)
                  .orElse(ResponseEntity.notFound().build());
    }

    // ── Worker: deactivate location sharing ───────────────────────────────────

    @PutMapping("/worker/{workerId}/deactivate")
    public ResponseEntity<Map<String, String>> deactivateWorkerLocation(
            @PathVariable String workerId) {

        locationService.deactivateWorkerLocation(workerId);
        return ResponseEntity.ok(Map.of("message", "Worker location deactivated"));
    }

    // ── Customer: store GPS on booking ────────────────────────────────────────

    /**
     * Called when customer selects "Doorstep" and browser geolocation resolves.
     *
     * Body: { "latitude": 12.9716, "longitude": 77.5946 }
     */
    @PutMapping("/booking/{bookingId}/customer")
    public ResponseEntity<CustomerServiceModel> storeCustomerLocation(
            @PathVariable String bookingId,
            @RequestBody LocationDTOs.CustomerLocationRequest req) {

        if (req.getLatitude() == null || req.getLongitude() == null) {
            return ResponseEntity.badRequest().build();
        }

        CustomerServiceModel updated =
                locationService.storeCustomerLocation(bookingId, req.getLatitude(), req.getLongitude());

        return ResponseEntity.ok(updated);
    }

    // ── Customer: poll worker's current position ──────────────────────────────

    /**
     * Customer can poll this if SSE is unavailable.
     * Prefer SSE (event: worker_location_update) for real-time updates.
     */
    @GetMapping("/booking/{bookingId}/worker")
    public ResponseEntity<LocationDTOs.WorkerLocationResponse> getWorkerLocationForBooking(
            @PathVariable String bookingId) {

        Optional<LocationDTOs.WorkerLocationResponse> loc =
                locationService.getWorkerLocationForBooking(bookingId);

        return loc.map(ResponseEntity::ok)
                  .orElse(ResponseEntity.notFound().build());
    }
}
