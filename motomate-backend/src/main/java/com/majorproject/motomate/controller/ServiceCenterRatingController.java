package com.majorproject.motomate.controller;

import com.majorproject.motomate.model.ServiceCenterRating;
import com.majorproject.motomate.repository.ServiceCenterRatingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;
//import java.util.stream.Collectors;

/**
 * POST /api/ratings/service-center          → submit a service-center rating
 * GET  /api/ratings/service-center/{id}     → ratings + average for a center
 */
@RestController
@RequestMapping("/api/ratings/service-center")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"}, allowCredentials = "true")
public class ServiceCenterRatingController {

    private final ServiceCenterRatingRepository ratingRepo;

    /**
     * Submit a rating.
     * Body: { bookingId, serviceCenterId, serviceCenterName, customerId, customerName, rating (1-5), feedback? }
     */
    @PostMapping
    public ResponseEntity<?> submitRating(@RequestBody Map<String, Object> body) {
        String bookingId = (String) body.get("bookingId");
        if (bookingId == null || bookingId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "bookingId is required"));
        }

        // One rating per booking
        if (ratingRepo.findByBookingId(bookingId).isPresent()) {
            return ResponseEntity.status(409).body(Map.of("error", "This booking has already been rated"));
        }

        Object ratingObj = body.get("rating");
        if (ratingObj == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "rating (1-5) is required"));
        }
        int rating = ((Number) ratingObj).intValue();
        if (rating < 1 || rating > 5) {
            return ResponseEntity.badRequest().body(Map.of("error", "rating must be between 1 and 5"));
        }

        ServiceCenterRating saved = ratingRepo.save(ServiceCenterRating.builder()
                .bookingId(bookingId)
                .serviceCenterId((String) body.get("serviceCenterId"))
                .serviceCenterName((String) body.getOrDefault("serviceCenterName", ""))
                .customerId((String) body.getOrDefault("customerId", ""))
                .customerName((String) body.getOrDefault("customerName", "Customer"))
                .rating(rating)
                .feedback((String) body.getOrDefault("feedback", null))
                .createdAt(Instant.now())
                .build());

        return ResponseEntity.ok(saved);
    }

    /**
     * Get all ratings and average for a service center.
     * Returns: { ratings: [...], averageRating: 4.2, totalRatings: 18 }
     */
    @GetMapping("/{serviceCenterId}")
    public ResponseEntity<Map<String, Object>> getCenterRatings(@PathVariable String serviceCenterId) {
        List<ServiceCenterRating> ratings = ratingRepo.findByServiceCenterId(serviceCenterId);

        double avg = ratings.stream()
                .mapToInt(ServiceCenterRating::getRating)
                .average()
                .orElse(0.0);

        // Round to 1 decimal place
        avg = Math.round(avg * 10.0) / 10.0;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("ratings", ratings);
        result.put("averageRating", avg);
        result.put("totalRatings", ratings.size());
        return ResponseEntity.ok(result);
    }
}
