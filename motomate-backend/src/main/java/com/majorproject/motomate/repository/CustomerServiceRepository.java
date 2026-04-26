package com.majorproject.motomate.repository;

import com.majorproject.motomate.model.CustomerServiceModel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
//import java.util.Optional;
import java.util.Optional;

@Repository
public interface CustomerServiceRepository extends MongoRepository<CustomerServiceModel, String> {

    List<CustomerServiceModel> findByUserId(String userId);

    Page<CustomerServiceModel> findByStatus(String status, Pageable pageable);

    List<CustomerServiceModel> findBySelectedDateBetween(LocalDate from, LocalDate to);
    Optional<CustomerServiceModel> findByScoRequestId(String scoRequestId);

    @Query("{ 'selectedDate': { $gte: ?0, $lte: ?1 } }")
    List<CustomerServiceModel> findByDateRange(LocalDate from, LocalDate to);

    long countByStatus(String status);

    List<CustomerServiceModel> findTop10ByOrderByCreatedAtDesc();

    // ── NEW: find the CustomerServiceModel that matches an SCOServiceRequest ──
    // SCOServiceRequest stores customerId = CustomerServiceModel.userId
    // and vehicleNumber. Together they uniquely identify the booking.
    @Query("{ 'userId': ?0, 'vehicleNumber': ?1, 'status': { $ne: 'COMPLETED' } }")
    List<CustomerServiceModel> findActiveByUserIdAndVehicleNumber(String userId, String vehicleNumber);

    // Simpler fallback: find by customerId (userId) ordered by latest
    List<CustomerServiceModel> findByUserIdOrderByCreatedAtDesc(String userId);
}