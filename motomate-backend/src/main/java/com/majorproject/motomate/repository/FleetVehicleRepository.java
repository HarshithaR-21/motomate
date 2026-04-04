package com.majorproject.motomate.repository;

import com.majorproject.motomate.model.FleetVehicle;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FleetVehicleRepository extends MongoRepository<FleetVehicle, String> {

    List<FleetVehicle> findByFleetManagerId(String fleetManagerId);

    Optional<FleetVehicle> findByVehicleNumber(String vehicleNumber);

    boolean existsByVehicleNumber(String vehicleNumber);

    List<FleetVehicle> findByFleetManagerIdAndVehicleType(String fleetManagerId, String vehicleType);

    List<FleetVehicle> findByFleetManagerIdAndStatus(String fleetManagerId, String status);

    long countByFleetManagerId(String fleetManagerId);
}
