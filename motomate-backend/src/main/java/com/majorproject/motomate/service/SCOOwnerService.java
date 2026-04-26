package com.majorproject.motomate.service;

import com.majorproject.motomate.model.*;
import com.majorproject.motomate.realtime.SseNotificationService;
import com.majorproject.motomate.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SCOOwnerService {

    @Autowired
    private SCOServiceRepository serviceRepo;
    @Autowired
    private SCOWorkerRepository workerRepo;
    @Autowired
    private SCOServiceRequestRepository requestRepo;
    @Autowired
    private ServiceCenterRegistrationRepository profileRepo;
    @Autowired
    private UserRepository userRepo;
    @Autowired
    private SseNotificationService sseNotificationService;
    @Autowired
    private CustomerServiceRepository customerServiceRepository; // ← ADDED

    @Autowired
    private PasswordEncoder passwordEncoder;

    // ═══════════════════════════════════════════════════════════════
    // DASHBOARD STATS
    // ═══════════════════════════════════════════════════════════════

    public Map<String, Object> getDashboardStats(String ownerId) {
        Map<String, Object> stats = new LinkedHashMap<>();

        stats.put("totalServices", serviceRepo.countByServiceCenterId(ownerId));
        stats.put("totalWorkers", workerRepo.countByServiceCenterId(ownerId));
        stats.put("availableWorkers", workerRepo.countByServiceCenterIdAndAvailability(ownerId, "AVAILABLE"));
        stats.put("pendingRequests", requestRepo.countByServiceCenterIdAndStatus(ownerId, "PENDING"));
        stats.put("acceptedRequests", requestRepo.countByServiceCenterIdAndStatus(ownerId, "ACCEPTED"));
        stats.put("completedRequests", requestRepo.countByServiceCenterIdAndStatus(ownerId, "COMPLETED"));
        stats.put("totalRequests", requestRepo.countByServiceCenterId(ownerId));

        profileRepo.findByEmail(getOwnerEmail(ownerId))
                .ifPresent(p -> stats.put("profileStatus", p.getApprovalStatus().name()));

        List<Map<String, Object>> recent = requestRepo
                .findByServiceCenterIdOrderByCreatedAtDesc(ownerId)
                .stream().limit(5)
                .map(this::summariseRequest)
                .collect(Collectors.toList());
        stats.put("recentRequests", recent);

        return stats;
    }

    private String getOwnerEmail(String ownerId) {
        return userRepo.findById(ownerId).map(UserModel::getEmail).orElse("");
    }

    private Map<String, Object> summariseRequest(SCOServiceRequest r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", r.getId());
        m.put("customerName", r.getCustomerName());
        m.put("serviceNames", r.getServiceNames());
        m.put("status", r.getStatus());
        m.put("urgency", r.getUrgency());
        m.put("scheduledDate", r.getScheduledDate());
        m.put("createdAt", r.getCreatedAt());
        return m;
    }

    // ═══════════════════════════════════════════════════════════════
    // PROFILE
    // ═══════════════════════════════════════════════════════════════

    public Optional<ServiceCenterRegistration> getProfile(String ownerId) {
        String email = getOwnerEmail(ownerId);
        return profileRepo.findByEmail(email);
    }

    // ═══════════════════════════════════════════════════════════════
    // SERVICE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════

    public SCOService createService(String ownerId, SCOService svc) {
        svc.setServiceCenterId(ownerId);
        svc.setActive(true);
        return serviceRepo.save(svc);
    }

    public List<SCOService> listServices(String ownerId) {
        return serviceRepo.findByServiceCenterId(ownerId);
    }

    public SCOService updateService(String ownerId, String serviceId, SCOService updated) {
        SCOService existing = serviceRepo.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("Service not found"));
        if (!existing.getServiceCenterId().equals(ownerId))
            throw new RuntimeException("Unauthorized");

        existing.setName(updated.getName());
        existing.setDescription(updated.getDescription());
        existing.setPrice(updated.getPrice());
        existing.setDurationMinutes(updated.getDurationMinutes());
        existing.setCategory(updated.getCategory());
        existing.setActive(updated.isActive());
        return serviceRepo.save(existing);
    }

    public void deleteService(String ownerId, String serviceId) {
        SCOService svc = serviceRepo.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("Service not found"));
        if (!svc.getServiceCenterId().equals(ownerId))
            throw new RuntimeException("Unauthorized");
        serviceRepo.deleteById(serviceId);
    }

    // ═══════════════════════════════════════════════════════════════
    // WORKER MANAGEMENT
    // ═══════════════════════════════════════════════════════════════

    public SCOWorker addWorker(String ownerId, SCOWorker worker, String workerPassword) {
        worker.setServiceCenterId(ownerId);
        worker.setAvailability("AVAILABLE");
        worker.setActive(true);
        worker.setCompletedJobs(0);
        worker.setRating(0.0);
        if (worker.getSkills() == null) {
            worker.setSkills(new ArrayList<>());
        }

        if (workerPassword != null && !workerPassword.isBlank()) {
            if (worker.getEmail() == null || worker.getEmail().isBlank()) {
                throw new RuntimeException("Email is required to create login credentials");
            }
            if (userRepo.findByEmail(worker.getEmail()).isPresent()) {
                throw new RuntimeException("A user with this email already exists");
            }

            UserModel workerUser = new UserModel();
            workerUser.setEmail(worker.getEmail());
            workerUser.setName(worker.getName());
            workerUser.setPhone(worker.getPhone());
            workerUser.setRole(UserRoles.WORKER);
            workerUser.setPassword(passwordEncoder.encode(workerPassword));
            workerUser.setActive(true);

            UserModel savedUser = userRepo.save(workerUser);
            worker.setWorkerUserId(savedUser.getId());
        }

        return workerRepo.save(worker);
    }

    public List<SCOWorker> listWorkers(String ownerId, String role, String availability) {
        if (role != null && !role.isBlank()) {
            return workerRepo.findByServiceCenterIdAndRole(ownerId, role);
        }
        if (availability != null && !availability.isBlank()) {
            return workerRepo.findByServiceCenterIdAndAvailability(ownerId, availability);
        }
        return workerRepo.findByServiceCenterId(ownerId);
    }

    public SCOWorker updateWorker(String ownerId, String workerId, SCOWorker updated) {
        SCOWorker existing = workerRepo.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found"));
        if (!existing.getServiceCenterId().equals(ownerId))
            throw new RuntimeException("Unauthorized");

        existing.setName(updated.getName());
        existing.setPhone(updated.getPhone());
        existing.setEmail(updated.getEmail());
        existing.setRole(updated.getRole());
        existing.setAvailability(updated.getAvailability());
        if (updated.getSkills() != null) {
            existing.setSkills(updated.getSkills());
        }
        return workerRepo.save(existing);
    }

    public SCOWorker toggleWorkerAvailability(String ownerId, String workerId) {
        SCOWorker worker = workerRepo.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found"));
        if (!worker.getServiceCenterId().equals(ownerId))
            throw new RuntimeException("Unauthorized");
        String next = "AVAILABLE".equals(worker.getAvailability()) ? "BUSY" : "AVAILABLE";
        worker.setAvailability(next);
        return workerRepo.save(worker);
    }

    public void deleteWorker(String ownerId, String workerId) {
        SCOWorker worker = workerRepo.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found"));
        if (!worker.getServiceCenterId().equals(ownerId))
            throw new RuntimeException("Unauthorized");
        workerRepo.deleteById(workerId);
    }

    // ═══════════════════════════════════════════════════════════════
    // SERVICE REQUEST MANAGEMENT
    // ═══════════════════════════════════════════════════════════════

    public List<SCOServiceRequest> listRequests(String ownerId, String status) {
        if (status != null && !status.isBlank()) {
            return requestRepo.findByServiceCenterIdAndStatus(ownerId, status);
        }
        return requestRepo.findByServiceCenterIdOrderByCreatedAtDesc(ownerId);
    }

    public SCOServiceRequest getRequest(String requestId) {
        return requestRepo.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
    }

    public SCOServiceRequest acceptRequest(String ownerId, String requestId) {
        SCOServiceRequest req = getRequest(requestId);
        if (!req.getServiceCenterId().equals(ownerId))
            throw new RuntimeException("Unauthorized");

        java.util.Set<String> requiredSkills = new java.util.HashSet<>();
        if (req.getServiceNames() != null) {
            for (String svcName : req.getServiceNames()) {
                serviceRepo.findByServiceCenterId(ownerId).stream()
                        .filter(s -> s.getName() != null && s.getName().equalsIgnoreCase(svcName))
                        .forEach(s -> {
                            if (s.getCategory() != null)
                                requiredSkills.add(normalise(s.getCategory()));
                            requiredSkills.add(normalise(s.getName()));
                        });
            }
        }

        List<SCOWorker> availableWorkers = workerRepo.findByServiceCenterIdAndAvailability(ownerId, "AVAILABLE");

        if (!availableWorkers.isEmpty()) {
            SCOWorker best = availableWorkers.stream()
                    .max(java.util.Comparator.comparingLong((SCOWorker w) -> {
                        List<String> skills = w.getSkills() != null ? w.getSkills() : List.of();
                        return skills.stream().filter(sk -> requiredSkills.contains(normalise(sk))).count();
                    }).thenComparingInt(w -> w.getCompletedJobs() != null ? w.getCompletedJobs() : 0))
                    .orElse(null);

            if (best != null) {
                req.setAssignedWorkerId(best.getId());
                req.setAssignedWorkerName(best.getName());
                req.setStatus("ASSIGNED");
                best.setAvailability("BUSY");
                workerRepo.save(best);
            } else {
                req.setStatus("ACCEPTED");
            }
        } else {
            req.setStatus("ACCEPTED");
        }

        req.setUpdatedAt(LocalDateTime.now());
        SCOServiceRequest saved = requestRepo.save(req);

        // ── Sync status to CustomerServiceModel ──────────────────────────────
        syncCustomerBookingStatus(saved.getId(), saved.getStatus());
        // ────────────────────────────────────────────────────────────────────

        return saved;
    }

    private String normalise(String raw) {
        if (raw == null)
            return "";
        return raw.toUpperCase().replace(" ", "_").replace("-", "_");
    }

    public SCOServiceRequest assignWorker(String ownerId, String requestId, String workerId) {
        SCOServiceRequest req = getRequest(requestId);
        if (!req.getServiceCenterId().equals(ownerId))
            throw new RuntimeException("Unauthorized");

        SCOWorker worker = workerRepo.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found"));

        req.setAssignedWorkerId(workerId);
        req.setAssignedWorkerName(worker.getName());
        req.setStatus("ASSIGNED");
        req.setUpdatedAt(java.time.LocalDateTime.now());

        worker.setAvailability("BUSY");
        workerRepo.save(worker);

        SCOServiceRequest saved = requestRepo.save(req);

        // ── Sync status to CustomerServiceModel ──────────────────────────────
        syncCustomerBookingStatus(saved.getId(), "ASSIGNED");
        // ────────────────────────────────────────────────────────────────────

        // ── Real-time notifications ──────────────────────────────────────────
        String workerPayload  = buildWorkerPayload(saved, worker);
        String customerPayload = buildCustomerPayload(saved, worker);

        sseNotificationService.notifyWorker(worker.getWorkerUserId(), workerId, workerPayload);
        sseNotificationService.notifyCustomer(saved.getCustomerId(), customerPayload);
        // ────────────────────────────────────────────────────────────────────

        return saved;
    }

    public SCOServiceRequest completeRequest(String ownerId, String requestId) {
        SCOServiceRequest req = getRequest(requestId);
        if (!req.getServiceCenterId().equals(ownerId))
            throw new RuntimeException("Unauthorized");
        req.setStatus("COMPLETED");
        req.setUpdatedAt(LocalDateTime.now());

        if (req.getAssignedWorkerId() != null) {
            workerRepo.findById(req.getAssignedWorkerId()).ifPresent(w -> {
                w.setAvailability("AVAILABLE");
                w.setCompletedJobs(w.getCompletedJobs() + 1);
                workerRepo.save(w);
            });
        }

        SCOServiceRequest saved = requestRepo.save(req);

        // ── Sync status to CustomerServiceModel ──────────────────────────────
        syncCustomerBookingStatus(saved.getId(), "COMPLETED");
        // ────────────────────────────────────────────────────────────────────

        return saved;
    }

    public SCOServiceRequest updateRequestStatus(String ownerId, String requestId, String status) {
        SCOServiceRequest req = getRequest(requestId);
        if (!req.getServiceCenterId().equals(ownerId))
            throw new RuntimeException("Unauthorized");
        req.setStatus(status);
        req.setUpdatedAt(LocalDateTime.now());

        SCOServiceRequest saved = requestRepo.save(req);

        // ── Sync status to CustomerServiceModel ──────────────────────────────
        syncCustomerBookingStatus(saved.getId(), status);
        // ────────────────────────────────────────────────────────────────────

        return saved;
    }

    public SCOServiceRequest createRequest(SCOServiceRequest request) {
        request.setStatus("PENDING");
        request.setCreatedAt(LocalDateTime.now());
        request.setUpdatedAt(LocalDateTime.now());
        return requestRepo.save(request);
    }

    // ── Helper: keep CustomerServiceModel.status in sync ─────────────────────
    private void syncCustomerBookingStatus(String scoRequestId, String status) {
        customerServiceRepository.findByScoRequestId(scoRequestId).ifPresent(booking -> {
            booking.setStatus(status);
            customerServiceRepository.save(booking);
        });
    }
    // ─────────────────────────────────────────────────────────────────────────

    private String buildWorkerPayload(SCOServiceRequest req, SCOWorker worker) {
        return "{"
                + "\"type\":\"WORKER_ASSIGNED\","
                + "\"jobId\":\"" + esc(req.getId()) + "\","
                + "\"requestId\":\"" + esc(req.getId()) + "\","
                + "\"customerName\":\"" + esc(req.getCustomerName()) + "\","
                + "\"customerPhone\":\"" + esc(req.getCustomerPhone()) + "\","
                + "\"vehicleNumber\":\"" + esc(req.getVehicleNumber()) + "\","
                + "\"brand\":\"" + esc(req.getBrand()) + "\","
                + "\"vehicleModel\":\"" + esc(req.getVehicleModel()) + "\","
                + "\"serviceNames\":" + toJsonArray(req.getServiceNames()) + ","
                + "\"totalPrice\":" + (req.getTotalPrice() != null ? req.getTotalPrice() : 0) + ","
                + "\"scheduledDate\":\"" + (req.getScheduledDate() != null ? req.getScheduledDate().toString() : "") + "\","
                + "\"scheduledTime\":\"" + (req.getScheduledTime() != null ? req.getScheduledTime().toString() : "") + "\","
                + "\"urgency\":\"" + esc(req.getUrgency()) + "\","
                + "\"serviceMode\":\"" + esc(req.getServiceMode()) + "\","
                + "\"address\":\"" + esc(req.getAddress()) + "\","
                + "\"status\":\"ASSIGNED\","
                + "\"message\":\"You have been assigned a new job!\""
                + "}";
    }

    private String buildCustomerPayload(SCOServiceRequest req, SCOWorker worker) {
        return "{"
                + "\"type\":\"WORKER_ASSIGNED_TO_CUSTOMER\","
                + "\"requestId\":\"" + esc(req.getId()) + "\","
                + "\"workerName\":\"" + esc(worker.getName()) + "\","
                + "\"workerPhone\":\"" + esc(worker.getPhone()) + "\","
                + "\"workerRole\":\"" + esc(worker.getRole()) + "\","
                + "\"workerRating\":" + (worker.getRating() != null ? worker.getRating() : 0) + ","
                + "\"workerSkills\":" + toJsonArray(worker.getSkills()) + ","
                + "\"status\":\"ASSIGNED\","
                + "\"serviceCenterId\":\"" + esc(req.getServiceCenterId()) + "\","
                + "\"message\":\"A worker has been assigned to your service request!\""
                + "}";
    }

    private String esc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private String toJsonArray(java.util.List<String> list) {
        if (list == null || list.isEmpty()) return "[]";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append("\"").append(esc(list.get(i))).append("\"");
        }
        sb.append("]");
        return sb.toString();
    }
}