package com.majorproject.motomate.repository;

import com.majorproject.motomate.model.EVWorkshop;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EVWorkshopRepository extends MongoRepository<EVWorkshop, String> {
    List<EVWorkshop> findByStatus(String status);
    List<EVWorkshop> findByStatusAndSupportedBrandsContaining(String status, String brand);
    boolean existsByEmail(String email);
}