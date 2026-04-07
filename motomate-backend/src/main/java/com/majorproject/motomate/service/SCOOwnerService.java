package com.majorproject.motomate.service;

import com.majorproject.motomate.model.*;
import com.majorproject.motomate.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SCOOwnerService {

    @Autowired private SCOServiceRepository serviceRepo;
    @Autowired private SCOWorkerRepository workerRepo;
    @Autowired private SCOServiceRequestRepository requestRepo;
    @Autowired private ServiceCenterRegistrationRepository profileRepo;
    @Autowired private UserRepository userRepo;

    // ═══════════════════════════════════════════════════════════════
    //  DASHBOARD STATS
    // ═══════════════════════════════════════════════════════════════

    public Map<String, Object> getDashboardStats(String ownerId) {
        Map<String, Object> stats = new LinkedHashMap<>();

        stats.put("totalServices",      serviceRepo.countByServiceCenterId(ownerId));
        stats.put("totalWorkers",       workerRepo.countByServiceCenterId(ownerId));
        stats.put("availableWorkers",   workerRepo.countByServiceCenterIdAndAvailability(ownerId, "AVAILABLE"));
        stats.put("pendingRequests",    requestRepo.countByServiceCenterIdAndStatus(ownerId, "PENDING"));
        stats.put("acceptedRequests",   requestRepo.countByServiceCenterIdAndStatus(ownerId, "ACCEPTED"));
        stats.put("completedRequests",  requestRepo.countByServiceCenterIdAndStatus(ownerId, "COMPLETED"));
        stats.put("totalRequests",      requestRepo.countByServiceCenterId(ownerId));

        // Profile approval status
        profileRepo.findByEmail(getOwnerEmail(ownerId)).ifPresent(p ->
            stats.put("profileStatus", p.getApprovalStatus().name())
        );

        // Recent 5 requests
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
        m.put("id",            r.getId());
        m.put("customerName",  r.getCustomerName());
        m.put("serviceNames",  r.getServiceNames());
        m.put("status",        r.getStatus());
        m.put("urgency",       r.getUrgency());
        m.put("scheduledDate", r.getScheduledDate());
        m.put("createdAt",     r.getCreatedAt());
        return m;
    }

    // ═══════════════════════════════════════════════════════════════
    //  PROFILE
    // ═══════════════════════════════════════════════════════════════

    public Optional<ServiceCenterRegistration> getProfile(String ownerId) {
        String email = getOwnerEmail(ownerId);
        return profileRepo.findByEmail(email);
    }

    // ═══════════════════════════════════════════════════════════════
    //  SERVICE MANAGEMENT
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
    //  WORKER MANAGEMENT
    // ═══════════════════════════════════════════════════════════════

    public SCOWorker addWorker(String ownerId, SCOWorker worker) {
        worker.setServiceCenterId(ownerId);
        worker.setAvailability("AVAILABLE");
        worker.setActive(true);
        worker.setCompletedJobs(0);
        worker.setRating(0.0);
        if (worker.getSkills() == null) {
            worker.setSkills(new java.util.ArrayList<>());
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
    //  SERVICE REQUEST MANAGEMENT
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

    /**
     * Accept a request AND auto-assign the best available worker by skill match.
     * Skill matching: each SCOService has a category; worker skills are matched
     * against those categories. The worker with the highest overlap is chosen.
     * If no skill match exists, falls back to the worker with the most completedJobs.
     * If no workers are available at all, the request is set to ACCEPTED (not ASSIGNED)
     * so the owner can manually assign later.
     */
    public SCOServiceRequest acceptRequest(String ownerId, String requestId) {
        SCOServiceRequest req = getRequest(requestId);
        if (!req.getServiceCenterId().equals(ownerId)) throw new RuntimeException("Unauthorized");

        // Collect required skill tags from the requested service names
        java.util.Set<String> requiredSkills = new java.util.HashSet<>();
        if (req.getServiceNames() != null) {
            for (String svcName : req.getServiceNames()) {
                // Match by name against active services of this center
                serviceRepo.findByServiceCenterId(ownerId).stream()
                    .filter(s -> s.getName() != null && s.getName().equalsIgnoreCase(svcName))
                    .forEach(s -> {
                        if (s.getCategory() != null) requiredSkills.add(normalise(s.getCategory()));
                        requiredSkills.add(normalise(s.getName()));
                    });
            }
        }

        // Find all AVAILABLE workers for this center
        List<SCOWorker> availableWorkers = workerRepo.findByServiceCenterIdAndAvailability(ownerId, "AVAILABLE");

        if (!availableWorkers.isEmpty()) {
            // Score each worker
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
            req.setStatus("ACCEPTED"); // No workers available — owner must assign manually
        }

        req.setUpdatedAt(LocalDateTime.now());
        return requestRepo.save(req);
    }

    private String normalise(String raw) {
        if (raw == null) return "";
        return raw.toUpperCase().replace(" ", "_").replace("-", "_");
    }

    public SCOServiceRequest assignWorker(String ownerId, String requestId, String workerId) {
        SCOServiceRequest req = getRequest(requestId);
        if (!req.getServiceCenterId().equals(ownerId)) throw new RuntimeException("Unauthorized");

        SCOWorker worker = workerRepo.findById(workerId)
            .orElseThrow(() -> new RuntimeException("Worker not found"));

        req.setAssignedWorkerId(workerId);
        req.setAssignedWorkerName(worker.getName());
        req.setStatus("ASSIGNED");
        req.setUpdatedAt(LocalDateTime.now());

        // Mark worker busy
        worker.setAvailability("BUSY");
        workerRepo.save(worker);

        return requestRepo.save(req);
    }

    public SCOServiceRequest completeRequest(String ownerId, String requestId) {
        SCOServiceRequest req = getRequest(requestId);
        if (!req.getServiceCenterId().equals(ownerId)) throw new RuntimeException("Unauthorized");
        req.setStatus("COMPLETED");
        req.setUpdatedAt(LocalDateTime.now());

        // Free the worker & increment completed jobs
        if (req.getAssignedWorkerId() != null) {
            workerRepo.findById(req.getAssignedWorkerId()).ifPresent(w -> {
                w.setAvailability("AVAILABLE");
                w.setCompletedJobs(w.getCompletedJobs() + 1);
                workerRepo.save(w);
            });
        }
        return requestRepo.save(req);
    }

    public SCOServiceRequest updateRequestStatus(String ownerId, String requestId, String status) {
        SCOServiceRequest req = getRequest(requestId);
        if (!req.getServiceCenterId().equals(ownerId)) throw new RuntimeException("Unauthorized");
        req.setStatus(status);
        req.setUpdatedAt(LocalDateTime.now());
        return requestRepo.save(req);
    }

    // Create a test/demo request (for development seeding)
    public SCOServiceRequest createRequest(SCOServiceRequest request) {
        request.setStatus("PENDING");
        request.setCreatedAt(LocalDateTime.now());
        request.setUpdatedAt(LocalDateTime.now());
        return requestRepo.save(request);
    }
}