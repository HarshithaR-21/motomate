package com.majorproject.motomate.repository;

import com.majorproject.motomate.model.FleetService;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface FleetServiceRepository extends MongoRepository<FleetService, String> {

    List<FleetService> findByFleetManagerId(String fleetManagerId);

    List<FleetService> findByVehicleId(String vehicleId);

    List<FleetService> findByFleetManagerIdAndStatus(String fleetManagerId, String status);

    List<FleetService> findByFleetManagerIdAndScheduledDateBetween(
            String fleetManagerId, LocalDate from, LocalDate to);

    List<FleetService> findByFleetManagerIdAndVehicleId(String fleetManagerId, String vehicleId);

    long countByFleetManagerIdAndStatus(String fleetManagerId, String status);

    List<FleetService> findByBulkBatchId(String batchId);
}
