package com.majorproject.motomate.service;

import com.majorproject.motomate.dto.EVDTOs;
import com.majorproject.motomate.model.EVServiceRequest;
import com.majorproject.motomate.model.EVVehicle;
import com.majorproject.motomate.model.EVWorker;
import com.majorproject.motomate.model.EVWorkshop;
import com.majorproject.motomate.model.UserModel;
import com.majorproject.motomate.repository.EVServiceRequestRepository;
import com.majorproject.motomate.repository.EVVehicleRepository;
import com.majorproject.motomate.repository.EVWorkerRepository;
import com.majorproject.motomate.repository.EVWorkshopRepository;
import com.majorproject.motomate.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class EVService {

    private static final double EARTH_RADIUS_KM = 6371.0;

    @Autowired
    private EVVehicleRepository vehicleRepository;

    @Autowired
    private EVWorkshopRepository workshopRepository;

    @Autowired
    private EVServiceRequestRepository requestRepository;

    @Autowired
    private EVWorkerRepository workerRepository;

    @Autowired
    private UserRepository userRepository;

    public EVVehicle createVehicle(EVDTOs.EVVehicleRequest req, String ownerId) {
        EVVehicle vehicle = EVVehicle.builder()
                .ownerId(ownerId)
                .vehicleNumber(req.getVehicleNumber())
                .manufacturer(req.getManufacturer())
                .model(req.getModel())
                .color(req.getColor())
                .yearOfManufacture(req.getYearOfManufacture())
                .batteryCapacityKwh(req.getBatteryCapacityKwh())
                .currentBatteryPercentage(req.getCurrentBatteryPercentage() != null ? req.getCurrentBatteryPercentage() : 100.0)
                .chargingPortType(req.getChargingPortType())
                .vehicleRangeKm(req.getVehicleRangeKm())
                .fastChargingSupported(req.isFastChargingSupported())
                .active(true)
                .build();
        return vehicleRepository.save(vehicle);
    }

    public List<EVVehicle> getVehicles(String ownerId) {
        return vehicleRepository.findByOwnerIdAndActiveTrue(ownerId);
    }

    public EVVehicle updateBattery(String id, String ownerId, Double percentage) {
        EVVehicle vehicle = vehicleRepository.findById(id)
                .filter(v -> ownerId.equals(v.getOwnerId()))
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found or not owned by current user"));
        double clamped = Math.max(0.0, Math.min(100.0, percentage));
        vehicle.setCurrentBatteryPercentage(clamped);
        return vehicleRepository.save(vehicle);
    }

    public void deleteVehicle(String id, String ownerId) {
        EVVehicle vehicle = vehicleRepository.findById(id)
                .filter(v -> ownerId.equals(v.getOwnerId()))
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found or not owned by current user"));
        vehicle.setActive(false);
        vehicleRepository.save(vehicle);
    }

    public List<EVWorkshop> getWorkshops() {
        seedDefaultWorkshops();
        List<EVWorkshop> list = workshopRepository.findByStatus("ACTIVE");
        list.forEach(this::ensureWorkshopDefaults);
        return list.stream()
                .sorted(Comparator.comparing((EVWorkshop w) -> Optional.ofNullable(w.getRating()).orElse(0.0)).reversed())
                .collect(Collectors.toList());
    }

    public List<EVWorkshop> getNearbyWorkshops(Double latitude, Double longitude) {
        seedDefaultWorkshops();
        List<EVWorkshop> list = workshopRepository.findByStatus("ACTIVE");
        list.forEach(w -> {
            w.setDistanceKm(distanceKm(latitude, longitude, w.getLatitude(), w.getLongitude()));
            ensureWorkshopDefaults(w);
        });
        return list.stream()
                .sorted(Comparator.comparing(w -> Optional.ofNullable(w.getDistanceKm()).orElse(Double.MAX_VALUE)))
                .collect(Collectors.toList());
    }

    public EVWorkshop getWorkshopById(String id) {
        return workshopRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Workshop not found"));
    }

    /**
     * Resolve the EV workshop managed by the currently logged-in user.
     * Matches on EVWorkshop.ownerId first (if previously linked), then
     * falls back to matching EVWorkshop.email against the user's email —
     * this covers workshops seeded before ownerId linking existed.
     */
    public EVWorkshop getMyWorkshop(String userId) {
        Optional<EVWorkshop> byOwner = workshopRepository.findByOwnerId(userId);
        if (byOwner.isPresent()) {
            return byOwner.get();
        }

        UserModel user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        EVWorkshop workshop = workshopRepository.findByEmail(user.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("No EV workshop is linked to this account"));

        // Backfill ownerId so future lookups are direct.
        if (workshop.getOwnerId() == null) {
            workshop.setOwnerId(userId);
            workshopRepository.save(workshop);
        }
        return workshop;
    }

    // ── EV Worker management ────────────────────────────────────────────────

    public List<EVWorker> getWorkshopWorkers(String workshopId) {
        workshopRepository.findById(workshopId)
                .orElseThrow(() -> new IllegalArgumentException("Workshop not found"));
        return workerRepository.findByWorkshopId(workshopId);
    }

    public EVWorker updateWorkerStatus(String workerId, String status) {
        EVWorker worker = workerRepository.findById(workerId)
                .orElseThrow(() -> new IllegalArgumentException("Worker not found"));

        List<String> validStatuses = List.of("AVAILABLE", "ASSIGNED", "OFF_DUTY");
        if (!validStatuses.contains(status)) {
            throw new IllegalArgumentException("Invalid availability status: " + status);
        }
        worker.setAvailabilityStatus(status);
        return workerRepository.save(worker);
    }

    /**
     * Assign an EV technician to a service request.
     * Moves the request to ASSIGNED status and marks the worker as ASSIGNED.
     */
    public EVServiceRequest assignWorker(String requestId, String workerId, String workshopId) {
        EVServiceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Service request not found"));

        if (!request.getSelectedWorkshopId().equals(workshopId)) {
            throw new IllegalArgumentException("This request does not belong to your workshop");
        }
        if (List.of("COMPLETED", "CANCELLED").contains(request.getStatus())) {
            throw new IllegalStateException("Cannot assign a worker to a completed or cancelled request");
        }

        EVWorker worker = workerRepository.findById(workerId)
                .orElseThrow(() -> new IllegalArgumentException("Worker not found"));
        if (!workshopId.equals(worker.getWorkshopId())) {
            throw new IllegalArgumentException("Worker does not belong to your workshop");
        }

        request.setAssignedWorkerId(worker.getId());
        request.setAssignedWorkerName(worker.getName());
        request.setAssignedWorkerPhone(worker.getPhone());
        request.setStatus("ASSIGNED");
        request.setAssignedAt(java.time.LocalDateTime.now());

        worker.setAvailabilityStatus("ASSIGNED");
        workerRepository.save(worker);

        return requestRepository.save(request);
    }

    public EVServiceRequest bookService(EVDTOs.EVBookServiceRequest request, String customerId) {
        EVVehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new IllegalArgumentException("Selected EV vehicle not found"));
        if (!customerId.equals(vehicle.getOwnerId())) {
            throw new IllegalArgumentException("You may only book service for your own vehicle");
        }

        EVWorkshop workshop = workshopRepository.findById(request.getSelectedWorkshopId())
                .orElseThrow(() -> new IllegalArgumentException("Selected workshop not found"));

        EVServiceRequest serviceRequest = EVServiceRequest.builder()
                .customerId(customerId)
                .vehicleId(vehicle.getId())
                .vehicleNumber(vehicle.getVehicleNumber())
                .vehicleMake(vehicle.getManufacturer())
                .vehicleModel(vehicle.getModel())
                .selectedWorkshopId(workshop.getId())
                .selectedWorkshopName(workshop.getWorkshopName())
                .serviceType(request.getServiceType())
                .serviceNames(request.getServiceNames())
                .description(request.getDescription())
                .customerLatitude(request.getCustomerLatitude())
                .customerLongitude(request.getCustomerLongitude())
                .customerAddress(request.getCustomerAddress())
                .status("REQUESTED")
                .estimatedArrivalMinutes(10 + new Random().nextInt(15))
                .build();

        if (workshop.getLatitude() != null && workshop.getLongitude() != null
                && request.getCustomerLatitude() != null && request.getCustomerLongitude() != null) {
            serviceRequest.setDistanceKm(distanceKm(
                    workshop.getLatitude(), workshop.getLongitude(),
                    request.getCustomerLatitude(), request.getCustomerLongitude()));
        }

        return requestRepository.save(serviceRequest);
    }

    public List<EVServiceRequest> getServiceHistory(String customerId) {
        return requestRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
    }

    public EVServiceRequest getRequest(String id, String customerId) {
        EVServiceRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Service request not found"));
        if (!customerId.equals(request.getCustomerId())) {
            throw new IllegalArgumentException("Not authorized to view this request");
        }
        return request;
    }

    public EVServiceRequest cancelRequest(String id, String customerId, String reason) {
        EVServiceRequest request = getRequest(id, customerId);
        if (request.getStatus() == null) {
            request.setStatus("CANCELLED");
        }
        if (request.getStatus().equals("COMPLETED") || request.getStatus().equals("CANCELLED")) {
            throw new IllegalStateException("Cannot cancel a completed or already cancelled request");
        }
        request.setStatus("CANCELLED");
        request.setCancellationReason(reason);
        return requestRepository.save(request);
    }

    public EVServiceRequest rateService(String id, Double rating, String review, String customerId) {
        EVServiceRequest request = getRequest(id, customerId);
        if (!"COMPLETED".equals(request.getStatus())) {
            throw new IllegalStateException("Only completed requests may be rated");
        }
        if (request.getRating() != null) {
            throw new IllegalStateException("This request has already been rated");
        }
        request.setRating(rating);
        request.setReview(review);
        return requestRepository.save(request);
    }

    public EVDTOs.EVChargingRequestResponse createChargingRequest(EVDTOs.EVChargingRequestDto request, String customerId) {
        EVVehicle vehicle = null;
        if (request.getVehicleId() != null) {
            vehicle = vehicleRepository.findById(request.getVehicleId()).orElse(null);
            if (vehicle != null && !customerId.equals(vehicle.getOwnerId())) {
                throw new IllegalArgumentException("Vehicle does not belong to the current user");
            }
        }

        return EVDTOs.EVChargingRequestResponse.builder()
                .id("CHG-" + java.util.UUID.randomUUID().toString().substring(0, 8))
                .customerId(customerId)
                .vehicleId(request.getVehicleId())
                .vehicleNumber(vehicle != null ? vehicle.getVehicleNumber() : request.getVehicleNumber())
                .chargingPortType(request.getChargingPortType())
                .currentBatteryPercentage(request.getCurrentBatteryPercentage())
                .targetBatteryPercentage(request.getTargetBatteryPercentage())
                .customerLatitude(request.getCustomerLatitude())
                .customerLongitude(request.getCustomerLongitude())
                .customerAddress(request.getCustomerAddress())
                .emergencyFlag(request.isEmergencyFlag())
                .assignedChargingVehicleId("EVCHG-" + new Random().nextInt(9999))
                .assignedDriverName("Ravi Kumar")
                .assignedDriverPhone("+91 98765 43210")
                .distanceKm(2.5)
                .status("REQUESTED")
                .priority(request.isEmergencyFlag() ? "HIGH" : "NORMAL")
                .estimatedArrivalMinutes(12 + new Random().nextInt(14))
                .build();
    }

    public List<Map<String, Object>> getChargingHistory(String customerId) {
        return List.of();
    }

    public Map<String, Object> createSOSRequest(Map<String, Object> payload, String customerId) {
        return Map.of(
                "id", "SOS-" + java.util.UUID.randomUUID().toString().substring(0, 8),
                "status", "RECEIVED",
                "customerId", customerId,
                "message", "Emergency EV assistance request received. A responder is being assigned.",
                "payload", payload
        );
    }

    // ── Workshop (Service Center) operations ───────────────────────────────────

    public List<EVServiceRequest> getWorkshopRequests(String workshopId) {
        workshopRepository.findById(workshopId)
                .orElseThrow(() -> new IllegalArgumentException("Workshop not found"));
        return requestRepository.findBySelectedWorkshopIdOrderByCreatedAtDesc(workshopId);
    }

    public EVDTOs.EVWorkshopStats getWorkshopStats(String workshopId) {
        workshopRepository.findById(workshopId)
                .orElseThrow(() -> new IllegalArgumentException("Workshop not found"));

        List<EVServiceRequest> requests = requestRepository.findBySelectedWorkshopIdOrderByCreatedAtDesc(workshopId);

        long pending = requests.stream().filter(r -> "REQUESTED".equals(r.getStatus())).count();
        long active = requests.stream()
                .filter(r -> List.of("ASSIGNED", "ACCEPTED", "ON_THE_WAY", "SERVICE_STARTED").contains(r.getStatus()))
                .count();
        long completed = requests.stream().filter(r -> "COMPLETED".equals(r.getStatus())).count();
        long cancelled = requests.stream().filter(r -> "CANCELLED".equals(r.getStatus())).count();

        List<EVWorker> workers = workerRepository.findByWorkshopId(workshopId);
        long availableWorkers = workers.stream().filter(w -> "AVAILABLE".equals(w.getAvailabilityStatus())).count();
        long assignedWorkers = workers.stream().filter(w -> "ASSIGNED".equals(w.getAvailabilityStatus())).count();
        long offDutyWorkers = workers.stream().filter(w -> "OFF_DUTY".equals(w.getAvailabilityStatus())).count();

        return EVDTOs.EVWorkshopStats.builder()
                .totalRequests(requests.size())
                .pendingRequests(pending)
                .activeRequests(active)
                .completedRequests(completed)
                .cancelledRequests(cancelled)
                .availableWorkers(availableWorkers)
                .assignedWorkers(assignedWorkers)
                .offDutyWorkers(offDutyWorkers)
                .build();
    }

    public EVServiceRequest updateRequestStatus(String requestId, String status, String reason) {
        EVServiceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Service request not found"));

        if (request.getStatus() == null) {
            request.setStatus("REQUESTED");
        }
        if (List.of("COMPLETED", "CANCELLED").contains(request.getStatus())) {
            throw new IllegalStateException("Cannot update a completed or cancelled request");
        }

        List<String> validStatuses = List.of(
                "REQUESTED", "ASSIGNED", "ACCEPTED", "ON_THE_WAY", "SERVICE_STARTED", "COMPLETED", "CANCELLED");
        if (!validStatuses.contains(status)) {
            throw new IllegalArgumentException("Invalid status: " + status);
        }

        request.setStatus(status);
        if ("CANCELLED".equals(status)) {
            request.setCancellationReason(reason);
        }
        if ("ASSIGNED".equals(status) && request.getAssignedAt() == null) {
            request.setAssignedAt(java.time.LocalDateTime.now());
        }
        if ("COMPLETED".equals(status)) {
            request.setCompletedAt(java.time.LocalDateTime.now());
        }
        return requestRepository.save(request);
    }

    private void seedDefaultWorkshops() {
        // Clean up any previously-seeded EV centers located outside Karnataka.
        workshopRepository.findAll().stream()
                .filter(w -> w.getState() != null && !"Karnataka".equalsIgnoreCase(w.getState()))
                .forEach(workshopRepository::delete);

        if (workshopRepository.count() > 0) {
            return;
        }

        List<EVWorkshop> examples = new ArrayList<>();
        examples.add(EVWorkshop.builder()
                .workshopName("GreenCharge EV Service")
                .ownerName("Arun Patel")
                .phoneNumber("+91 98765 43210")
                .email("greencharge@example.com")
                .address("18 Electric Avenue")
                .city("Bangalore")
                .state("Karnataka")
                .latitude(12.9716)
                .longitude(77.5946)
                .description("Certified EV technicians for doorstep and workshop repairs.")
                .certificationLevel("CERTIFIED_EXPERT")
                .operatingHours("9:00 AM - 8:00 PM")
                .openDays(List.of("MON", "TUE", "WED", "THU", "FRI", "SAT"))
                .supportedBrands(List.of("Tata", "Ather", "Mahindra", "Ola", "Hyundai"))
                .supportedChargingPorts(List.of("CCS", "CCS2", "Type2"))
                .rating(4.9)
                .totalReviews(142)
                .availableWorkers(6)
                .build());
        workshopRepository.saveAll(examples);
    }

    private void ensureWorkshopDefaults(EVWorkshop w) {
        if (w.getAvailableWorkers() == null) {
            w.setAvailableWorkers(2 + new Random().nextInt(5));
        }
        if (w.getDistanceKm() == null) {
            w.setDistanceKm(0.0);
        }
    }

    private double distanceKm(Double lat1, Double lng1, Double lat2, Double lng2) {
        if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) {
            return Double.MAX_VALUE;
        }
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_KM * c;
    }
}
