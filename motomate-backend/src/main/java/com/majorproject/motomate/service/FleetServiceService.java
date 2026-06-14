package com.majorproject.motomate.service;

import com.majorproject.motomate.dto.FleetServiceDTOs.*;
import com.majorproject.motomate.model.*;
import com.majorproject.motomate.repository.*;
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

    private final FleetServiceRepository   serviceRepo;
    private final FleetVehicleRepository   vehicleRepo;
    private final SCOServiceRequestRepository scoRequestRepo;
    private final SCOWorkerRepository      workerRepo;
    private final UserRepository           userRepository;

    private static final DateTimeFormatter DT_FMT   = DateTimeFormatter.ISO_DATE_TIME;
    private static final DateTimeFormatter DATE_FMT  = DateTimeFormatter.ISO_DATE;
    private static final DateTimeFormatter TIME_FMT  = DateTimeFormatter.ofPattern("HH:mm");

    // ── Fix 9: Discount tiers ────────────────────────────────────
    private static final int DISCOUNT_5_VEHICLES  = 10;
    private static final int DISCOUNT_2_VEHICLES  = 5;

    private int calculateDiscountPercent(int vehicleCount) {
        if (vehicleCount >= 5) return DISCOUNT_5_VEHICLES;
        if (vehicleCount >= 2) return DISCOUNT_2_VEHICLES;
        return 0;
    }

    // ── Schedule Single Service ─────────────────────────────────
    public ServiceResponse scheduleService(String fleetManagerId, ServiceRequest req) {
        FleetVehicle vehicle = vehicleRepo.findById(req.getVehicleId())
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found: " + req.getVehicleId()));

        // Resolve service names: prefer selectedServiceNames, fallback to serviceType
        List<String> serviceNames = resolveServiceNames(req.getSelectedServiceNames(), req.getServiceType());

        FleetService fs = FleetService.builder()
                .vehicleId(req.getVehicleId())
                .vehicleNumber(vehicle.getVehicleNumber())
                .fleetManagerId(fleetManagerId)
                .serviceType(req.getServiceType() != null ? req.getServiceType()
                        : (serviceNames.isEmpty() ? "SERVICE" : serviceNames.get(0)))
                .selectedServiceNames(serviceNames)
                .serviceCenter(req.getServiceCenter())
                .serviceCenterId(req.getServiceCenterId())
                .scheduledDate(req.getScheduledDate())
                .scheduledTime(req.getScheduledTime())
                .estimatedCost(req.getEstimatedCost())
                .notes(req.getNotes())
                .status("PENDING")
                .discountPercent(0)
                .discountAmount(0.0)
                .finalCost(req.getEstimatedCost())
                .build();

        FleetService saved = serviceRepo.save(fs);

        // Create SCOServiceRequest so it appears in the SCO dashboard
        createSCOServiceRequest(saved, req.getServiceCenter(), req.getServiceCenterId(),
                serviceNames, req.getPreferredWorkerId(), req.getPreferredWorkerName(),
                vehicle, fleetManagerId);

        return toResponse(serviceRepo.findById(saved.getId()).orElse(saved), vehicle);
    }

    // ── Bulk Schedule ────────────────────────────────────────────
    public BulkScheduleSummary bulkSchedule(String fleetManagerId, BulkServiceRequest req) {
        if (req.getVehicleIds() == null || req.getVehicleIds().size() < 2) {
            throw new IllegalArgumentException("Bulk booking requires at least 2 vehicles");
        }

        String batchId = UUID.randomUUID().toString();
        int vehicleCount = req.getVehicleIds().size();

        List<String> serviceNames = resolveServiceNames(req.getSelectedServiceNames(), req.getServiceType());

        int discountPercent = calculateDiscountPercent(vehicleCount);
        double costPerVehicle = req.getEstimatedCostPerVehicle() != null ? req.getEstimatedCostPerVehicle() : 0.0;
        double subtotal = costPerVehicle * vehicleCount;
        double discountAmount = Math.round(subtotal * discountPercent / 100.0 * 100.0) / 100.0;
        double totalPayable = subtotal - discountAmount;

        double discountPerVehicle = vehicleCount > 0 ? Math.round(discountAmount / vehicleCount * 100.0) / 100.0 : 0.0;
        double finalCostPerVehicle = costPerVehicle - discountPerVehicle;

        List<ServiceResponse> results = new ArrayList<>();
        for (String vehicleId : req.getVehicleIds()) {
            FleetVehicle vehicle = vehicleRepo.findById(vehicleId).orElse(null);
            if (vehicle == null) continue;

            FleetService fs = FleetService.builder()
                    .vehicleId(vehicleId)
                    .vehicleNumber(vehicle.getVehicleNumber())
                    .fleetManagerId(fleetManagerId)
                    .serviceType(req.getServiceType() != null ? req.getServiceType()
                            : (serviceNames.isEmpty() ? "SERVICE" : serviceNames.get(0)))
                    .selectedServiceNames(serviceNames)
                    .serviceCenter(req.getServiceCenter())
                    .serviceCenterId(req.getServiceCenterId())
                    .scheduledDate(req.getScheduledDate())
                    .scheduledTime(req.getScheduledTime())
                    .estimatedCost(costPerVehicle > 0 ? costPerVehicle : null)
                    .notes(req.getNotes())
                    .status("PENDING")
                    .bulkBatchId(batchId)
                    .discountPercent(discountPercent)
                    .discountAmount(discountPerVehicle)
                    .finalCost(costPerVehicle > 0 ? finalCostPerVehicle : null)
                    .build();

            FleetService saved = serviceRepo.save(fs);

            // Create SCOServiceRequest for each vehicle
            createSCOServiceRequest(saved, req.getServiceCenter(), req.getServiceCenterId(),
                    serviceNames, req.getPreferredWorkerId(), req.getPreferredWorkerName(),
                    vehicle, fleetManagerId);

            FleetVehicle vFinal = vehicle;
            results.add(toResponse(serviceRepo.findById(saved.getId()).orElse(saved), vFinal));
        }

        return BulkScheduleSummary.builder()
                .services(results)
                .vehicleCount(vehicleCount)
                .subtotal(subtotal)
                .discountPercent(discountPercent)
                .discountAmount(discountAmount)
                .totalPayable(totalPayable)
                .batchId(batchId)
                .build();
    }

    // ── Create SCOServiceRequest (makes fleet bookings visible in SCO dashboard) ──
    private void createSCOServiceRequest(FleetService fs, String serviceCenter, String serviceCenterId,
                                         List<String> serviceNames, String preferredWorkerId, String preferredWorkerName,
                                         FleetVehicle vehicle, String fleetManagerId) {
        if (serviceCenterId == null || serviceCenterId.isBlank()) return;

        // Get fleet manager name from user repo
        String managerName = "Fleet Manager";
        String managerPhone = "";
        String managerEmail = "";
        Optional<UserModel> managerOpt = userRepository.findById(fleetManagerId);
        if (managerOpt.isPresent()) {
            UserModel u = managerOpt.get();
            managerName = u.getName() != null ? u.getName() : managerName;
            managerPhone = u.getPhone() != null ? u.getPhone() : "";
            managerEmail = u.getEmail() != null ? u.getEmail() : "";
        }

        SCOServiceRequest req = SCOServiceRequest.builder()
                .serviceCenterId(serviceCenterId)
                .customerId(fleetManagerId)
                .customerName(managerName + " (Fleet)")
                .customerPhone(managerPhone)
                .customerEmail(managerEmail)
                .vehicleType(vehicle.getVehicleType())
                .brand(vehicle.getBrand())
                .vehicleModel(vehicle.getModel())
                .vehicleNumber(vehicle.getVehicleNumber())
                .serviceNames(serviceNames)
                .scheduledDate(fs.getScheduledDate())
                .scheduledTime(fs.getScheduledTime())
                .urgency("NORMAL")
                .serviceMode("DROPOFF")
                .additionalNotes(fs.getNotes())
                .status("PENDING")
                .bookingSource("FLEET")
                .build();

        // If fleet manager selected a preferred worker, assign immediately
        if (preferredWorkerId != null && !preferredWorkerId.isBlank()) {
            req.setAssignedWorkerId(preferredWorkerId);
            req.setAssignedWorkerName(preferredWorkerName != null ? preferredWorkerName : "");
            req.setStatus("ASSIGNED");
            // Also update FleetService
            fs.setAssignedWorker(preferredWorkerName);
            fs.setAssignedWorkerId(preferredWorkerId);
            fs.setStatus("ASSIGNED");
        }

        SCOServiceRequest saved = scoRequestRepo.save(req);

        // Link back to FleetService
        fs.setScoRequestId(saved.getId());
        serviceRepo.save(fs);
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
        if (req.getAssignedWorker() != null)   fs.setAssignedWorker(req.getAssignedWorker());
        if (req.getAssignedWorkerId() != null)  fs.setAssignedWorkerId(req.getAssignedWorkerId());
        if (req.getActualCost() != null)        fs.setActualCost(req.getActualCost());
        if (req.getNotes() != null)             fs.setNotes(req.getNotes());
        if ("COMPLETED".equals(req.getStatus())) fs.setCompletedAt(LocalDateTime.now());

        // Sync status to linked SCOServiceRequest
        if (fs.getScoRequestId() != null) {
            scoRequestRepo.findById(fs.getScoRequestId()).ifPresent(scoReq -> {
                scoReq.setStatus(req.getStatus());
                if (req.getAssignedWorkerId() != null) {
                    scoReq.setAssignedWorkerId(req.getAssignedWorkerId());
                    scoReq.setAssignedWorkerName(req.getAssignedWorker());
                }
                scoRequestRepo.save(scoReq);
            });
        }

        FleetService saved = serviceRepo.save(fs);
        FleetVehicle v = vehicleRepo.findById(saved.getVehicleId()).orElse(null);
        return toResponse(saved, v);
    }

    // ── Rate Service Center ──────────────────────────────────────
    public ServiceResponse rateServiceCenter(String serviceId, int rating, String feedback) {
        FleetService fs = serviceRepo.findById(serviceId)
                .orElseThrow(() -> new IllegalArgumentException("Service not found: " + serviceId));

        if (!"COMPLETED".equals(fs.getStatus())) {
            throw new IllegalStateException("Can only rate completed services");
        }
        if (fs.isRated()) {
            throw new IllegalStateException("This service has already been rated");
        }

        fs.setRated(true);
        fs.setServiceCenterRating(rating);
        fs.setServiceCenterFeedback(feedback);

        FleetService saved = serviceRepo.save(fs);
        syncFleetRatingToSCORequest(saved, rating, feedback);

        FleetVehicle v = vehicleRepo.findById(saved.getVehicleId()).orElse(null);
        return toResponse(saved, v);
    }

    private void syncFleetRatingToSCORequest(FleetService fs, int rating, String feedback) {
        if (fs.getScoRequestId() == null || fs.getScoRequestId().isBlank()) return;

        scoRequestRepo.findById(fs.getScoRequestId()).ifPresent(req -> {
            if (req.isRated()) return;

            req.setCustomerRating((double) rating);
            req.setCustomerFeedback(feedback != null ? feedback.trim() : null);
            req.setRated(true);
            req.setUpdatedAt(LocalDateTime.now());
            scoRequestRepo.save(req);

            if (req.getAssignedWorkerId() != null) {
                recalculateWorkerAverage(req.getAssignedWorkerId());
            }
        });
    }

    private void recalculateWorkerAverage(String workerId) {
        List<SCOServiceRequest> ratedRequests = scoRequestRepo.findRatedRequestsByWorkerId(workerId);
        OptionalDouble avg = ratedRequests.stream()
                .mapToDouble(r -> r.getCustomerRating() != null ? r.getCustomerRating() : 0.0)
                .average();

        double rounded = avg.isPresent()
                ? Math.round(avg.getAsDouble() * 10.0) / 10.0
                : 0.0;

        workerRepo.findById(workerId).ifPresent(w -> {
            w.setRating(rounded);
            workerRepo.save(w);
        });
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

        double totalCost = all.stream().mapToDouble(s -> {
            if (s.getFinalCost() != null)    return s.getFinalCost();
            if (s.getActualCost() != null)   return s.getActualCost();
            if (s.getEstimatedCost() != null) return s.getEstimatedCost();
            return 0.0;
        }).sum();

        double totalSavings = all.stream()
                .mapToDouble(s -> s.getDiscountAmount() != null ? s.getDiscountAmount() : 0.0)
                .sum();

        long completed = all.stream().filter(s -> "COMPLETED".equals(s.getStatus())).count();
        long pending   = all.stream().filter(s -> "PENDING".equals(s.getStatus())).count();

        Map<String, double[]> monthlyCosts = new TreeMap<>();
        for (FleetService s : all) {
            if (s.getScheduledDate() == null) continue;
            String month = s.getScheduledDate().format(DateTimeFormatter.ofPattern("MMM yyyy"));
            double cost = s.getFinalCost() != null ? s.getFinalCost()
                    : (s.getActualCost() != null ? s.getActualCost()
                    : (s.getEstimatedCost() != null ? s.getEstimatedCost() : 0.0));
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

        Map<String, double[]> vehicleStats = new LinkedHashMap<>();
        for (FleetService s : all) {
            double cost = s.getFinalCost() != null ? s.getFinalCost()
                    : (s.getActualCost() != null ? s.getActualCost()
                    : (s.getEstimatedCost() != null ? s.getEstimatedCost() : 0.0));
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
                .totalSavings(totalSavings)
                .totalServices(all.size())
                .completedServices(completed)
                .pendingServices(pending)
                .monthlyCostStats(monthly)
                .vehicleServiceStats(vehicleStatsList)
                .build();
    }

    // ── Helpers ──────────────────────────────────────────────────
    private List<String> resolveServiceNames(List<String> selected, String fallbackType) {
        if (selected != null && !selected.isEmpty()) return selected;
        if (fallbackType != null && !fallbackType.isBlank()) {
            return List.of(fallbackType.replace("_", " "));
        }
        return List.of();
    }

    private ServiceResponse toResponse(FleetService s, FleetVehicle v) {
        return ServiceResponse.builder()
                .id(s.getId())
                .vehicleId(s.getVehicleId())
                .vehicleNumber(s.getVehicleNumber())
                .vehicleType(v != null ? v.getVehicleType() : null)
                .serviceType(s.getServiceType())
                .selectedServiceNames(s.getSelectedServiceNames())
                .serviceCenter(s.getServiceCenter())
                .serviceCenterId(s.getServiceCenterId())
                .assignedWorker(s.getAssignedWorker())
                .assignedWorkerId(s.getAssignedWorkerId())
                .scoRequestId(s.getScoRequestId())
                .scheduledDate(s.getScheduledDate() != null ? s.getScheduledDate().format(DATE_FMT) : null)
                .scheduledTime(s.getScheduledTime() != null ? s.getScheduledTime().format(TIME_FMT) : null)
                .estimatedCost(s.getEstimatedCost())
                .actualCost(s.getActualCost())
                .status(s.getStatus())
                .notes(s.getNotes())
                .bulkBatchId(s.getBulkBatchId())
                .discountPercent(s.getDiscountPercent())
                .discountAmount(s.getDiscountAmount())
                .finalCost(s.getFinalCost())
                .rated(s.isRated())
                .serviceCenterRating(s.getServiceCenterRating())
                .serviceCenterFeedback(s.getServiceCenterFeedback())
                .createdAt(s.getCreatedAt() != null ? s.getCreatedAt().format(DT_FMT) : null)
                .updatedAt(s.getUpdatedAt() != null ? s.getUpdatedAt().format(DT_FMT) : null)
                .completedAt(s.getCompletedAt() != null ? s.getCompletedAt().format(DT_FMT) : null)
                .build();
    }
}
