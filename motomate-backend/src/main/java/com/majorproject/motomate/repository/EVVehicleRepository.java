package com.majorproject.motomate.repository;

import com.majorproject.motomate.model.EVVehicle;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EVVehicleRepository extends MongoRepository<EVVehicle, String> {
    List<EVVehicle> findByOwnerIdAndActiveTrue(String ownerId);
    List<EVVehicle> findByOwnerId(String ownerId);
}