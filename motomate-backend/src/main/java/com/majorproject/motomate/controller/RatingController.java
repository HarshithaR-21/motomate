package com.majorproject.motomate.controller;

import com.majorproject.motomate.model.WorkerRating;
import com.majorproject.motomate.service.RatingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * POST /api/ratings                  → submit a rating
 * GET  /api/ratings/worker/{id}      → all ratings + average for a worker
 */
@RestController
@RequestMapping("/api/ratings")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173","http://localhost:3000"}, allowCredentials = "true")
public class RatingController {

    private final RatingService ratingService;

    /**
     * Submit a rating.
     * Body: { bookingId, workerId, workerName, customerName, vehicleNumber, rating (1-5), feedback? }
     */
    @PostMapping
    public ResponseEntity<?> submitRating(@RequestBody Map<String, Object> body) {
        try {
            WorkerRating saved = ratingService.submitRating(
                    (String) body.get("bookingId"),
                    (String) body.get("workerId"),
                    (String) body.getOrDefault("workerName", ""),
                    (String) body.getOrDefault("customerName", "Customer"),
                    (String) body.getOrDefault("vehicleNumber", ""),
                    (Integer) body.get("rating"),
                    (String) body.getOrDefault("feedback", null)
            );
            return ResponseEntity.ok(saved);
        } catch (IllegalStateException e) {
            // Already rated
            return ResponseEntity.status(409).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get all ratings and average for a worker.
     * Returns: { ratings: [...], averageRating: 4.3, totalRatings: 17 }
     */
    @GetMapping("/worker/{workerId}")
    public ResponseEntity<Map<String, Object>> getWorkerRatings(@PathVariable String workerId) {
        return ResponseEntity.ok(ratingService.getRatingsForWorker(workerId));
    }
}
