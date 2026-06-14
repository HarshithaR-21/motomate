package com.majorproject.motomate.repository;

import com.majorproject.motomate.model.EVChargingVehicle;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EVChargingVehicleRepository extends MongoRepository<EVChargingVehicle, String> {
    List<EVChargingVehicle> findByStatus(String status);
    List<EVChargingVehicle> findByStatusAndConnectorTypesContaining(String status, String connectorType);
}