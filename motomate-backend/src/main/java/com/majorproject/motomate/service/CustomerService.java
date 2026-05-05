package com.majorproject.motomate.service;

import com.majorproject.motomate.model.CustomerServiceModel;
import com.majorproject.motomate.model.SCOService;
import com.majorproject.motomate.model.SCOServiceRequest;
import com.majorproject.motomate.model.SCOWorker;
import com.majorproject.motomate.model.UserModel;
import com.majorproject.motomate.realtime.SseNotificationService;
import com.majorproject.motomate.repository.CustomerServiceRepository;
import com.majorproject.motomate.repository.SCOServiceRepository;
import com.majorproject.motomate.repository.SCOServiceRequestRepository;
import com.majorproject.motomate.repository.SCOWorkerRepository;
import com.majorproject.motomate.repository.UserRepository;
import com.majorproject.motomate.repository.WorkerServiceRequestRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.logging.Logger;
import java.util.stream.Collectors;

@Service
public class CustomerService {

    private static final Logger log = Logger.getLogger(CustomerService.class.getName());

    @Autowired
    private CustomerServiceRepository customerServiceRepository;
    @Autowired
    private SCOServiceRequestRepository scoServiceRequestRepository;
    @Autowired
    private SCOServiceRepository scoServiceRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private WorkerServiceRequestRepository workerServiceRequestRepository;
    @Autowired
    private SCOWorkerRepository scoWorkerRepository;
    @Autowired
    private SseNotificationService sseNotificationService;

    // ── NEW dependency ───────────────────────────────────────────────────────
    @Autowired
    private LocationService locationService;
    // ─────────────────────────────────────────────────────────────────────────

    // 1. Create service booking
    public CustomerServiceModel createService(CustomerServiceModel customerService) {
        customerService.setCreatedAt(LocalDateTime.now());
        CustomerServiceModel saved = customerServiceRepository.save(customerService);

        // Auto-route: create a PENDING SCOServiceRequest for the chosen service center
        if (customerService.getServiceCenterId() != null
                && !customerService.getServiceCenterId().isBlank()) {
            try {
                createSCOServiceRequest(saved);
            } catch (Exception e) {
                log.warning("Failed to create SCOServiceRequest: " + e.getMessage());
            }
        }

        // ── Haversine nearest-worker auto-assignment (Doorstep only) ──────────
        boolean isDoorstep = "Doorstep".equalsIgnoreCase(saved.getServiceMode())
                || "HOME_SERVICE".equalsIgnoreCase(saved.getServiceMode());

        boolean hasLocation = saved.getCustomerLatitude() != null
                && saved.getCustomerLongitude() != null;

        if (isDoorstep && hasLocation) {
            try {
                Optional<SCOWorker> assigned = locationService.assignNearestWorker(saved);
                assigned.ifPresent(w -> log
                        .info("Auto-assigned nearest worker: " + w.getName() + " for booking " + saved.getId()));
            } catch (Exception e) {
                log.warning("Haversine auto-assign failed: " + e.getMessage());
                // Non-fatal — SCO can still assign manually
            }
        }
        // ─────────────────────────────────────────────────────────────────────
        String preferredWorkerId = customerService.getPreferredWorkerId();
        String preferredWorkerName = customerService.getPreferredWorkerName();

        if (preferredWorkerId != null && !preferredWorkerId.isBlank()) {
            try {
                // Find the SCOServiceRequest that was just created for this booking
                workerServiceRequestRepository.findById(saved.getScoRequestId())
                        .ifPresent(req -> {
                            scoWorkerRepository.findById(preferredWorkerId).ifPresent(worker -> {

                                // Assign on the SCOServiceRequest
                                req.setAssignedWorkerId(preferredWorkerId);
                                req.setAssignedWorkerName(
                                        preferredWorkerName != null ? preferredWorkerName : worker.getName());
                                req.setStatus("ASSIGNED");
                                workerServiceRequestRepository.save(req);

                                // Mirror status on CustomerServiceModel
                                saved.setAssignedWorkerId(preferredWorkerId);
                                saved.setAssignedWorkerName(worker.getName());
                                saved.setStatus("ASSIGNED");
                                customerServiceRepository.save(saved);

                                // Mark worker as BUSY
                                worker.setAvailability("BUSY");
                                scoWorkerRepository.save(worker);

                                // Notify customer via SSE — worker card appears immediately
                                double rating = worker.getRating() != null ? worker.getRating() : 0.0;
                                String skills = worker.getSkills() != null
                                        ? "\"" + String.join("\",\"", worker.getSkills()) + "\""
                                        : "";
                                String assignedPayload = "{"
                                        + "\"requestId\":\"" + req.getId() + "\","
                                        + "\"workerName\":\"" + worker.getName() + "\","
                                        + "\"workerRole\":\"" + worker.getRole() + "\","
                                        + "\"workerPhone\":\"" + (worker.getPhone() != null ? worker.getPhone() : "")
                                        + "\","
                                        + "\"workerRating\":" + rating + ","
                                        + "\"workerSkills\":[" + skills + "]"
                                        + "}";
                                sseNotificationService.notifyCustomer(saved.getUserId(), assignedPayload);

                                // Notify the worker via SSE — new job appears on their dashboard
                                String workerPayload = "{"
                                        + "\"requestId\":\"" + req.getId() + "\","
                                        + "\"customerName\":\""
                                        + (req.getCustomerName() != null ? req.getCustomerName() : "") + "\","
                                        + "\"vehicleNumber\":\""
                                        + (req.getVehicleNumber() != null ? req.getVehicleNumber() : "") + "\","
                                        + "\"serviceNames\":" + toJsonArray(req.getServiceNames())
                                        + "}";
                                sseNotificationService.notifyWorker(
                                        worker.getWorkerUserId(), worker.getId(), workerPayload);

                                log.info("Preferred worker assigned: " + worker.getName()
                                        + " for booking " + saved.getId());
                            });
                        });
            } catch (Exception e) {
                log.warning("Preferred worker assignment failed: " + e.getMessage());
                // Non-fatal — Haversine or SCO manual assign will still work
            }
        }
        return saved;
    }

    private void createSCOServiceRequest(CustomerServiceModel booking) {
        List<SCOService> services = booking.getSelectedServiceIds() != null
                ? booking.getSelectedServiceIds().stream()
                        .map(id -> scoServiceRepository.findById(id).orElse(null))
                        .filter(s -> s != null)
                        .collect(Collectors.toList())
                : List.of();

        List<String> serviceNames = services.stream().map(SCOService::getName).collect(Collectors.toList());
        double totalPrice = services.stream().mapToDouble(s -> s.getPrice() != null ? s.getPrice() : 0).sum();
        int totalDuration = services.stream().mapToInt(s -> s.getDurationMinutes() != null ? s.getDurationMinutes() : 0)
                .sum();

        String customerName = "";
        String customerPhone = "";
        String customerEmail = "";
        if (booking.getUserId() != null) {
            Optional<UserModel> userOpt = userRepository.findById(booking.getUserId());
            if (userOpt.isPresent()) {
                UserModel user = userOpt.get();
                customerName = user.getName() != null ? user.getName() : "";
                customerPhone = user.getPhone() != null ? user.getPhone() : "";
                customerEmail = user.getEmail() != null ? user.getEmail() : "";
            }
        }

        SCOServiceRequest req = SCOServiceRequest.builder()
                .serviceCenterId(booking.getServiceCenterId())
                .customerId(booking.getUserId())
                .customerName(customerName)
                .customerPhone(customerPhone)
                .customerEmail(customerEmail)
                .vehicleType(booking.getVehicleType())
                .brand(booking.getBrand())
                .vehicleModel(booking.getModel())
                .fuelType(booking.getFuelType())
                .vehicleNumber(booking.getVehicleNumber())
                .serviceNames(serviceNames.isEmpty() ? booking.getSelectedServiceNames() : serviceNames)
                .totalPrice(totalPrice > 0 ? totalPrice : booking.getTotalEstimatedPrice())
                .totalDurationMinutes(totalDuration > 0 ? totalDuration : booking.getTotalEstimatedDuration())
                .scheduledDate(booking.getSelectedDate())
                .scheduledTime(booking.getSelectedTime())
                .urgency(booking.getUrgency() != null ? booking.getUrgency().toUpperCase() : "NORMAL")
                .serviceMode(booking.getServiceMode())
                .address(booking.getManualAddress())
                .additionalNotes(booking.getAdditionalNotes())
                // ── NEW: pass customer GPS to worker's job ────────────────────
                .customerLatitude(booking.getCustomerLatitude())
                .customerLongitude(booking.getCustomerLongitude())
                // ─────────────────────────────────────────────────────────────
                .status("PENDING")
                .build();

        SCOServiceRequest savedReq = scoServiceRequestRepository.save(req);
        booking.setScoRequestId(savedReq.getId());
        customerServiceRepository.save(booking);
    }

    // 2. Get all services
    public List<CustomerServiceModel> getAllServices() {
        return customerServiceRepository.findAll();
    }

    // 3. Edit service
    public CustomerServiceModel editService(String id, CustomerServiceModel updatedService) {
        Optional<CustomerServiceModel> existingOpt = customerServiceRepository.findById(id);
        if (existingOpt.isPresent()) {
            CustomerServiceModel existing = existingOpt.get();
            existing.setVehicleType(updatedService.getVehicleType());
            existing.setSelectedVehicle(updatedService.getSelectedVehicle());
            existing.setBrand(updatedService.getBrand());
            existing.setModel(updatedService.getModel());
            existing.setFuelType(updatedService.getFuelType());
            existing.setVehicleNumber(updatedService.getVehicleNumber());
            existing.setServiceLocation(updatedService.getServiceLocation());
            existing.setManualAddress(updatedService.getManualAddress());
            existing.setServiceMode(updatedService.getServiceMode());
            existing.setSelectedDate(updatedService.getSelectedDate());
            existing.setSelectedTime(updatedService.getSelectedTime());
            existing.setUrgency(updatedService.getUrgency());
            existing.setAdditionalNotes(updatedService.getAdditionalNotes());
            existing.setUploadedFiles(updatedService.getUploadedFiles());
            return customerServiceRepository.save(existing);
        }
        return null;
    }
    private String toJsonArray(List<String> items) {
        if (items == null || items.isEmpty()) return "[]";
        return "[\"" + String.join("\",\"", items) + "\"]";
    }
    
}
