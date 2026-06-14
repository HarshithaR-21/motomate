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

    // ── Add Vehicle ──────────────────────────────────────────────
    public VehicleResponse addVehicle(String fleetManagerId, VehicleRequest req) {
        if (vehicleRepo.existsByVehicleNumber(req.getVehicleNumber())) {
            throw new IllegalArgumentException(
                    "Vehicle number " + req.getVehicleNumber() + " is already registered.");
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

    // ── Get All Vehicles — scoped to manager ─────────────────────
    // Fix 6: findByFleetManagerId already scopes to the logged-in manager
    public List<VehicleResponse> getVehicles(String fleetManagerId) {
        return vehicleRepo.findByFleetManagerId(fleetManagerId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ── Get Single Vehicle — with ownership check ─────────────────
    // Fix 6: verifies vehicle belongs to requesting manager
    public VehicleResponse getVehicleForManager(String id, String fleetManagerId) {
        FleetVehicle v = vehicleRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found: " + id));
        if (!fleetManagerId.equals(v.getFleetManagerId())) {
            throw new IllegalArgumentException("Access denied: vehicle does not belong to your account.");
        }
        return toResponse(v);
    }

    // ── Update Vehicle — with ownership check ────────────────────
    // Fix 6: ensures manager can only edit their own vehicles
    public VehicleResponse updateVehicle(String id, String fleetManagerId, VehicleRequest req) {
        FleetVehicle v = vehicleRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found: " + id));

        if (!fleetManagerId.equals(v.getFleetManagerId())) {
            throw new IllegalArgumentException("Access denied: vehicle does not belong to your account.");
        }

        // If number changed, check uniqueness
        if (!v.getVehicleNumber().equalsIgnoreCase(req.getVehicleNumber())
                && vehicleRepo.existsByVehicleNumber(req.getVehicleNumber().toUpperCase())) {
            throw new IllegalArgumentException(
                    "Vehicle number " + req.getVehicleNumber() + " is already registered.");
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

    // ── Delete Vehicle — with ownership check ────────────────────
    // Fix 6: ensures manager can only delete their own vehicles
    public void deleteVehicle(String id, String fleetManagerId) {
        FleetVehicle v = vehicleRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found: " + id));
        if (!fleetManagerId.equals(v.getFleetManagerId())) {
            throw new IllegalArgumentException("Access denied: vehicle does not belong to your account.");
        }
        vehicleRepo.deleteById(id);
    }

    // ── Dashboard Stats ───────────────────────────────────────────
    public FleetDashboardStats getDashboardStats(String fleetManagerId) {
        long total      = vehicleRepo.countByFleetManagerId(fleetManagerId);
        long active     = serviceRepo.countByFleetManagerIdAndStatus(fleetManagerId, "IN_PROGRESS")
                        + serviceRepo.countByFleetManagerIdAndStatus(fleetManagerId, "ASSIGNED");
        long completed  = serviceRepo.countByFleetManagerIdAndStatus(fleetManagerId, "COMPLETED");
        long pending    = serviceRepo.countByFleetManagerIdAndStatus(fleetManagerId, "PENDING");
        long inProgress = serviceRepo.countByFleetManagerIdAndStatus(fleetManagerId, "IN_PROGRESS");

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

    // ── Mapper ────────────────────────────────────────────────────
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
