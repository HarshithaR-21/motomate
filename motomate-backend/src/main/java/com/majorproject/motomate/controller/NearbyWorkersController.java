package com.majorproject.motomate.controller;

import com.majorproject.motomate.service.WorkerLocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * GET /api/location/workers/active
 *   ?serviceCenterId=xxx   (optional filter)
 *
 * Returns a list of workers who have shared their GPS in the last 5 minutes.
 * Each entry: { id, workerId, workerName, role, rating, skills, phone, latitude, longitude }
 *
 * The Haversine calculation happens on the frontend (NearbyWorkersMap.jsx)
 * so the response intentionally sends raw coordinates.
 */
@RestController
@RequestMapping("/api/location")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173","http://localhost:5174","http://localhost:5175","http://localhost:3000"}, allowCredentials = "true")
public class NearbyWorkersController {

    private final WorkerLocationService workerLocationService;

    @GetMapping("/workers/active")
    public ResponseEntity<List<Map<String, Object>>> getActiveWorkers(
            @RequestParam(required = false) String serviceCenterId) {

        List<Map<String, Object>> workers =
                workerLocationService.getActiveWorkers(serviceCenterId);
        return ResponseEntity.ok(workers);
    }
}