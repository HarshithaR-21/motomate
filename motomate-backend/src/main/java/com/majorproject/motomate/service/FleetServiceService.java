package com.majorproject.motomate.service;

import com.majorproject.motomate.dto.FleetServiceDTOs.*;
import com.majorproject.motomate.model.FleetService;
import com.majorproject.motomate.model.FleetVehicle;
import com.majorproject.motomate.repository.FleetServiceRepository;
import com.majorproject.motomate.repository.FleetVehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FleetServiceService {

    private final FleetServiceRepository serviceRepo;
    private final FleetVehicleRepository vehicleRepo;

    private static final DateTimeFormatter DT_FMT = DateTimeFormatter.ISO_DATE_TIME;
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_DATE;
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    // ── Schedule Single Service ─────────────────────────────────
    public ServiceResponse scheduleService(String fleetManagerId, ServiceRequest req) {
        FleetVehicle vehicle = vehicleRepo.findById(req.getVehicleId())
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found: " + req.getVehicleId()));

        FleetService fs = FleetService.builder()
                .vehicleId(req.getVehicleId())
                .vehicleNumber(vehicle.getVehicleNumber())
                .fleetManagerId(fleetManagerId)
                .serviceType(req.getServiceType())
                .serviceCenter(req.getServiceCenter())
                .scheduledDate(req.getScheduledDate())
                .scheduledTime(req.getScheduledTime())
                .estimatedCost(req.getEstimatedCost())
                .notes(req.getNotes())
                .status("PENDING")
                .build();

        return toResponse(serviceRepo.save(fs), vehicle);
    }

    // ── Bulk Schedule ────────────────────────────────────────────
    public List<ServiceResponse> bulkSchedule(String fleetManagerId, BulkServiceRequest req) {
        String batchId = UUID.randomUUID().toString();

        List<ServiceResponse> results = new ArrayList<>();
        for (String vehicleId : req.getVehicleIds()) {
            FleetVehicle vehicle = vehicleRepo.findById(vehicleId).orElse(null);
            if (vehicle == null) continue;

            FleetService fs = FleetService.builder()
                    .vehicleId(vehicleId)
                    .vehicleNumber(vehicle.getVehicleNumber())
                    .fleetManagerId(fleetManagerId)
                    .serviceType(req.getServiceType())
                    .serviceCenter(req.getServiceCenter())
                    .scheduledDate(req.getScheduledDate())
                    .scheduledTime(req.getScheduledTime())
                    .estimatedCost(req.getEstimatedCostPerVehicle())
                    .notes(req.getNotes())
                    .status("PENDING")
                    .bulkBatchId(batchId)
                    .build();

            results.add(toResponse(serviceRepo.save(fs), vehicle));
        }
        return results;
    }

    // ── Get All Services ────────────────────────────────────────
    public List<ServiceResponse> getServices(String fleetManagerId, String status, String vehicleId) {
        List<FleetService> services;
        if (vehicleId != null && !vehicleId.isBlank()) {
            services = serviceRepo.findByFleetManagerIdAndVehicleId(fleetManagerId, vehicleId);
        } else if (status != null && !status.isBlank()) {
            services = serviceRepo.findByFleetManagerIdAndStatus(fleetManagerId, status);
        } else {
            services = serviceRepo.findByFleetManagerId(fleetManagerId);
        }
        return services.stream().map(s -> {
            FleetVehicle v = vehicleRepo.findById(s.getVehicleId()).orElse(null);
            return toResponse(s, v);
        }).collect(Collectors.toList());
    }

    // ── Update Service Status ────────────────────────────────────
    public ServiceResponse updateStatus(String serviceId, StatusUpdateRequest req) {
        FleetService fs = serviceRepo.findById(serviceId)
                .orElseThrow(() -> new IllegalArgumentException("Service not found: " + serviceId));

        fs.setStatus(req.getStatus());
        if (req.getAssignedWorker() != null) fs.setAssignedWorker(req.getAssignedWorker());
        if (req.getAssignedWorkerId() != null) fs.setAssignedWorkerId(req.getAssignedWorkerId());
        if (req.getActualCost() != null) fs.setActualCost(req.getActualCost());
        if (req.getNotes() != null) fs.setNotes(req.getNotes());
        if ("COMPLETED".equals(req.getStatus())) fs.setCompletedAt(LocalDateTime.now());

        FleetService saved = serviceRepo.save(fs);
        FleetVehicle v = vehicleRepo.findById(saved.getVehicleId()).orElse(null);
        return toResponse(saved, v);
    }

    // ── Get Maintenance Report ───────────────────────────────────
    public MaintenanceReport getReport(String fleetManagerId, LocalDate from, LocalDate to, String vehicleId) {
        List<FleetService> all;
        if (from != null && to != null) {
            all = serviceRepo.findByFleetManagerIdAndScheduledDateBetween(fleetManagerId, from, to);
        } else {
            all = serviceRepo.findByFleetManagerId(fleetManagerId);
        }

        if (vehicleId != null && !vehicleId.isBlank()) {
            all = all.stream().filter(s -> vehicleId.equals(s.getVehicleId())).collect(Collectors.toList());
        }

        double totalCost = all.stream().mapToDouble(s ->
                s.getActualCost() != null ? s.getActualCost()
                        : (s.getEstimatedCost() != null ? s.getEstimatedCost() : 0.0)).sum();

        long completed = all.stream().filter(s -> "COMPLETED".equals(s.getStatus())).count();
        long pending   = all.stream().filter(s -> "PENDING".equals(s.getStatus())).count();

        // Monthly cost aggregation
        Map<String, double[]> monthlyCosts = new TreeMap<>();
        for (FleetService s : all) {
            if (s.getScheduledDate() == null) continue;
            String month = s.getScheduledDate().format(DateTimeFormatter.ofPattern("MMM yyyy"));
            double cost = s.getActualCost() != null ? s.getActualCost()
                    : (s.getEstimatedCost() != null ? s.getEstimatedCost() : 0.0);
            monthlyCosts.computeIfAbsent(month, k -> new double[]{0.0, 0.0});
            monthlyCosts.get(month)[0] += cost;
            monthlyCosts.get(month)[1]++;
        }

        List<MonthlyCostStat> monthly = monthlyCosts.entrySet().stream()
                .map(e -> MonthlyCostStat.builder()
                        .month(e.getKey())
                        .cost(e.getValue()[0])
                        .count((long) e.getValue()[1])
                        .build())
                .collect(Collectors.toList());

        // Per-vehicle aggregation
        Map<String, double[]> vehicleStats = new LinkedHashMap<>();
        for (FleetService s : all) {
            double cost = s.getActualCost() != null ? s.getActualCost()
                    : (s.getEstimatedCost() != null ? s.getEstimatedCost() : 0.0);
            vehicleStats.computeIfAbsent(s.getVehicleNumber(), k -> new double[]{0.0, 0.0});
            vehicleStats.get(s.getVehicleNumber())[0] += cost;
            vehicleStats.get(s.getVehicleNumber())[1]++;
        }

        List<VehicleServiceStat> vehicleStatsList = vehicleStats.entrySet().stream()
                .map(e -> VehicleServiceStat.builder()
                        .vehicleNumber(e.getKey())
                        .totalCost(e.getValue()[0])
                        .serviceCount((long) e.getValue()[1])
                        .build())
                .collect(Collectors.toList());

        List<ServiceResponse> responses = all.stream().map(s -> {
            FleetVehicle v = vehicleRepo.findById(s.getVehicleId()).orElse(null);
            return toResponse(s, v);
        }).collect(Collectors.toList());

        return MaintenanceReport.builder()
                .services(responses)
                .totalCost(totalCost)
                .totalServices(all.size())
                .completedServices(completed)
                .pendingServices(pending)
                .monthlyCostStats(monthly)
                .vehicleServiceStats(vehicleStatsList)
                .build();
    }

    // ── Mapper ───────────────────────────────────────────────────
    private ServiceResponse toResponse(FleetService s, FleetVehicle v) {
        return ServiceResponse.builder()
                .id(s.getId())
                .vehicleId(s.getVehicleId())
                .vehicleNumber(s.getVehicleNumber())
                .vehicleType(v != null ? v.getVehicleType() : null)
                .serviceType(s.getServiceType())
                .serviceCenter(s.getServiceCenter())
                .assignedWorker(s.getAssignedWorker())
                .scheduledDate(s.getScheduledDate() != null ? s.getScheduledDate().format(DATE_FMT) : null)
                .scheduledTime(s.getScheduledTime() != null ? s.getScheduledTime().format(TIME_FMT) : null)
                .estimatedCost(s.getEstimatedCost())
                .actualCost(s.getActualCost())
                .status(s.getStatus())
                .notes(s.getNotes())
                .bulkBatchId(s.getBulkBatchId())
                .createdAt(s.getCreatedAt() != null ? s.getCreatedAt().format(DT_FMT) : null)
                .updatedAt(s.getUpdatedAt() != null ? s.getUpdatedAt().format(DT_FMT) : null)
                .completedAt(s.getCompletedAt() != null ? s.getCompletedAt().format(DT_FMT) : null)
                .build();
    }
}
