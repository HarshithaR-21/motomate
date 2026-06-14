package com.majorproject.motomate.repository;

import com.majorproject.motomate.model.EVWorker;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EVWorkerRepository extends MongoRepository<EVWorker, String> {
    List<EVWorker> findByWorkshopId(String workshopId);
    List<EVWorker> findByWorkshopIdAndAvailabilityStatusAndEvCertifiedTrue(
            String workshopId, String availabilityStatus);
    List<EVWorker> findByAvailabilityStatus(String status);
    Optional<EVWorker> findByWorkerUserId(String workerUserId);
    long countByWorkshopIdAndAvailabilityStatus(String workshopId, String status);
}