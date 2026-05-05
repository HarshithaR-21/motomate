package com.majorproject.motomate.service;

import com.majorproject.motomate.model.SCOWorker;
import com.majorproject.motomate.model.WorkerRating;
import com.majorproject.motomate.repository.RatingRepository;
import com.majorproject.motomate.repository.SCOWorkerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RatingService {

    private final RatingRepository ratingRepository;
    private final SCOWorkerRepository workerRepository;   // your existing repo

    /**
     * Submit a rating for a completed job.
     * Rejects duplicate ratings (one per booking).
     */
    public WorkerRating submitRating(
            String bookingId, String workerId, String workerName,
            String customerName, String vehicleNumber, int rating, String feedback) {

        if (ratingRepository.existsByBookingId(bookingId)) {
            throw new IllegalStateException("Booking " + bookingId + " has already been rated.");
        }

        WorkerRating wr = WorkerRating.builder()
                .bookingId(bookingId)
                .workerId(workerId)
                .workerName(workerName)
                .customerName(customerName)
                .vehicleNumber(vehicleNumber)
                .rating(rating)
                .feedback(feedback)
                .createdAt(Instant.now())
                .build();

        WorkerRating saved = ratingRepository.save(wr);

        // Update running average on the SCOWorker document
        updateWorkerAverage(workerId);

        return saved;
    }

    /** Fetch all ratings for a worker (newest first) plus the average. */
    public Map<String, Object> getRatingsForWorker(String workerId) {
        List<WorkerRating> ratings = ratingRepository.findByWorkerIdOrderByCreatedAtDesc(workerId);
        double avg = ratings.stream()
                .mapToInt(WorkerRating::getRating)
                .average()
                .orElse(0.0);
        return Map.of(
                "ratings", ratings,
                "averageRating", Math.round(avg * 10.0) / 10.0,
                "totalRatings", ratings.size()
        );
    }

    /** Recalculate and persist the average rating on the SCOWorker entity. */
    private void updateWorkerAverage(String workerId) {
        List<WorkerRating> all = ratingRepository.findByWorkerIdOrderByCreatedAtDesc(workerId);
        double avg = all.stream().mapToInt(WorkerRating::getRating).average().orElse(0.0);
        double rounded = Math.round(avg * 10.0) / 10.0;

        workerRepository.findById(workerId).ifPresent(w -> {
            w.setRating(rounded);          // assumes SCOWorker has setRating(double)
            workerRepository.save(w);
        });
    }
}
