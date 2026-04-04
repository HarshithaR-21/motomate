package com.majorproject.motomate.service;

import com.majorproject.motomate.dto.FleetVehicleDTOs.*;
import com.majorproject.motomate.model.FleetVehicle;
import com.majorproject.motomate.repository.FleetServiceRepository;
import com.majorproject.motomate.repository.FleetVehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FleetVehicleService {

    private final FleetVehicleRepository vehicleRepo;
    private final FleetServiceRepository serviceRepo;

    private static final DateTimeFormatter DT_FMT = DateTimeFormatter.ISO_DATE_TIME;

    // ── Add Vehicle ─────────────────────────────────────────────
    public VehicleResponse addVehicle(String fleetManagerId, VehicleRequest req) {
        if (vehicleRepo.existsByVehicleNumber(req.getVehicleNumber())) {
            throw new IllegalArgumentException(
                    "Vehicle number " + req.getVehicleNumber() + " already exists");
        }

        FleetVehicle vehicle = FleetVehicle.builder()
                .vehicleNumber(req.getVehicleNumber().toUpperCase())
                .vehicleType(req.getVehicleType())
                .brand(req.getBrand())
                .model(req.getModel())
                .fuelType(req.getFuelType())
                .year(req.getYear())
                .issueDescription(req.getIssueDescription())
                .fleetTag(req.getFleetTag())
                .fleetManagerId(fleetManagerId)
                .build();

        return toResponse(vehicleRepo.save(vehicle));
    }

    // ── Get All Vehicles ────────────────────────────────────────
    public List<VehicleResponse> getVehicles(String fleetManagerId) {
        return vehicleRepo.findByFleetManagerId(fleetManagerId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ── Get Single Vehicle ──────────────────────────────────────
    public VehicleResponse getVehicle(String id) {
        FleetVehicle v = vehicleRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found: " + id));
        return toResponse(v);
    }

    // ── Update Vehicle ──────────────────────────────────────────
    public VehicleResponse updateVehicle(String id, VehicleRequest req) {
        FleetVehicle v = vehicleRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found: " + id));

        // if number changed, check uniqueness
        if (!v.getVehicleNumber().equals(req.getVehicleNumber())
                && vehicleRepo.existsByVehicleNumber(req.getVehicleNumber())) {
            throw new IllegalArgumentException(
                    "Vehicle number " + req.getVehicleNumber() + " already exists");
        }

        v.setVehicleNumber(req.getVehicleNumber().toUpperCase());
        v.setVehicleType(req.getVehicleType());
        v.setBrand(req.getBrand());
        v.setModel(req.getModel());
        v.setFuelType(req.getFuelType());
        v.setYear(req.getYear());
        v.setIssueDescription(req.getIssueDescription());
        v.setFleetTag(req.getFleetTag());

        return toResponse(vehicleRepo.save(v));
    }

    // ── Delete Vehicle ──────────────────────────────────────────
    public void deleteVehicle(String id) {
        if (!vehicleRepo.existsById(id)) {
            throw new IllegalArgumentException("Vehicle not found: " + id);
        }
        vehicleRepo.deleteById(id);
    }

    // ── Dashboard Stats ─────────────────────────────────────────
    public FleetDashboardStats getDashboardStats(String fleetManagerId) {
        long total       = vehicleRepo.countByFleetManagerId(fleetManagerId);
        long active      = serviceRepo.countByFleetManagerIdAndStatus(fleetManagerId, "IN_PROGRESS")
                         + serviceRepo.countByFleetManagerIdAndStatus(fleetManagerId, "ASSIGNED");
        long completed   = serviceRepo.countByFleetManagerIdAndStatus(fleetManagerId, "COMPLETED");
        long pending     = serviceRepo.countByFleetManagerIdAndStatus(fleetManagerId, "PENDING");
        long inProgress  = serviceRepo.countByFleetManagerIdAndStatus(fleetManagerId, "IN_PROGRESS");

        double totalCost = serviceRepo.findByFleetManagerIdAndStatus(fleetManagerId, "COMPLETED")
                .stream()
                .mapToDouble(s -> s.getActualCost() != null ? s.getActualCost()
                        : (s.getEstimatedCost() != null ? s.getEstimatedCost() : 0.0))
                .sum();

        return FleetDashboardStats.builder()
                .totalVehicles(total)
                .activeServices(active)
                .completedServices(completed)
                .pendingRequests(pending)
                .inProgressServices(inProgress)
                .totalMaintenanceCost(totalCost)
                .build();
    }

    // ── Mapper ───────────────────────────────────────────────────
    private VehicleResponse toResponse(FleetVehicle v) {
        return VehicleResponse.builder()
                .id(v.getId())
                .vehicleNumber(v.getVehicleNumber())
                .vehicleType(v.getVehicleType())
                .brand(v.getBrand())
                .model(v.getModel())
                .fuelType(v.getFuelType())
                .year(v.getYear())
                .issueDescription(v.getIssueDescription())
                .fleetTag(v.getFleetTag())
                .status(v.getStatus())
                .createdAt(v.getCreatedAt() != null ? v.getCreatedAt().format(DT_FMT) : null)
                .updatedAt(v.getUpdatedAt() != null ? v.getUpdatedAt().format(DT_FMT) : null)
                .build();
    }
}
