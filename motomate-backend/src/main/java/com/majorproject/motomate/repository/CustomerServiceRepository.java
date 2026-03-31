package com.majorproject.motomate.repository;

import com.majorproject.motomate.model.CustomerServiceModel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CustomerServiceRepository extends MongoRepository<CustomerServiceModel, String> {

    List<CustomerServiceModel> findByUserId(String userId);

    Page<CustomerServiceModel> findByStatus(String status, Pageable pageable);

    List<CustomerServiceModel> findBySelectedDateBetween(LocalDate from, LocalDate to);

    @Query("{ 'selectedDate': { $gte: ?0, $lte: ?1 } }")
    List<CustomerServiceModel> findByDateRange(LocalDate from, LocalDate to);

    long countByStatus(String status);

    List<CustomerServiceModel> findTop10ByOrderByCreatedAtDesc();
}
