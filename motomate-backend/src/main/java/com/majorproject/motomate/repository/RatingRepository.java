package com.majorproject.motomate.repository;

import com.majorproject.motomate.model.WorkerRating;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RatingRepository extends MongoRepository<WorkerRating, String> {

    List<WorkerRating> findByWorkerIdOrderByCreatedAtDesc(String workerId);

    Optional<WorkerRating> findByBookingId(String bookingId);

    boolean existsByBookingId(String bookingId);
}
