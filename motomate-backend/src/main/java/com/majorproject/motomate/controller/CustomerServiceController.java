package com.majorproject.motomate.controller;

import com.majorproject.motomate.model.CustomerServiceModel;
import com.majorproject.motomate.model.SCOService;
import com.majorproject.motomate.model.SCOWorker;
import com.majorproject.motomate.model.ServiceCenterRegistration;
import com.majorproject.motomate.enums.ApprovalStatus;
import com.majorproject.motomate.repository.SCOServiceRepository;
import com.majorproject.motomate.repository.SCOWorkerRepository;
import com.majorproject.motomate.repository.ServiceCenterRegistrationRepository;
import com.majorproject.motomate.repository.UserRepository;
import com.majorproject.motomate.service.CustomerService;
import com.majorproject.motomate.service.WorkerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.logging.Logger;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/services")
@CrossOrigin(
    origins  = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175"},
    allowCredentials = "true"
)
public class CustomerServiceController {

    @Autowired private CustomerService            customerServiceService;
    @Autowired private ServiceCenterRegistrationRepository serviceCenterRepo;
    @Autowired private SCOServiceRepository       scoServiceRepo;
    @Autowired private SCOWorkerRepository        scoWorkerRepo;
    @Autowired private UserRepository             userRepository;
    @Autowired private WorkerService              workerService;

    private static final Logger log =
            Logger.getLogger(CustomerServiceController.class.getName());

    // ── 1. Create booking ─────────────────────────────────────────────────────

    @PostMapping("/book-service")
    public ResponseEntity<?> createService(@RequestBody CustomerServiceModel customerService) {
        try {
            // CustomerService.createService handles:
            //   - saving the CustomerServiceModel
            //   - creating the linked SCOServiceRequest
            //   - Haversine auto-assign (if no preferredWorkerId)
            //   - preferred worker assignment (if preferredWorkerId is set)
            CustomerServiceModel created = customerServiceService.createService(customerService);
            return new ResponseEntity<>(created, HttpStatus.CREATED);
        } catch (Exception e) {
            log.severe("Error creating service: " + e.getMessage());
            return new ResponseEntity<>("Error: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ── 2. Get all bookings ───────────────────────────────────────────────────

    @GetMapping("/all")
    public ResponseEntity<List<CustomerServiceModel>> getAllServices() {
        try {
            return new ResponseEntity<>(customerServiceService.getAllServices(), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    // ── 3. Edit booking ───────────────────────────────────────────────────────

    @PutMapping("/edit/{id}")
    public ResponseEntity<?> editService(
            @PathVariable String id,
            @RequestBody CustomerServiceModel customerService) {
        try {
            CustomerServiceModel updated = customerServiceService.editService(id, customerService);
            if (updated != null) return new ResponseEntity<>(updated, HttpStatus.OK);
            return new ResponseEntity<>("Service not found", HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Error: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ── 4. Rate a completed job ───────────────────────────────────────────────

    /**
     * PUT /api/services/{bookingId}/rate
     * Body: { "rating": 4, "feedback": "Great service!" }
     *
     * The frontend sends the CustomerServiceModel.id (booking.id).
     * We resolve that → SCOServiceRequest via scoRequestId, then persist the rating.
     */
    @Autowired private com.majorproject.motomate.repository.CustomerServiceRepository customerServiceRepo;

    @PutMapping("/{bookingId}/rate")
    public ResponseEntity<?> rateJob(
            @PathVariable String bookingId,
            @RequestBody Map<String, Object> body) {
        try {
            double rating    = ((Number) body.get("rating")).doubleValue();
            String feedback  = (String) body.getOrDefault("feedback", null);

            // FIX: bookingId is CustomerServiceModel.id — resolve the linked SCOServiceRequest
            com.majorproject.motomate.model.CustomerServiceModel booking =
                    customerServiceRepo.findById(bookingId)
                            .orElse(null);

            String scoRequestId = null;
            if (booking != null && booking.getScoRequestId() != null) {
                scoRequestId = booking.getScoRequestId();
            } else {
                // Fallback: maybe the caller passed the SCOServiceRequest.id directly
                scoRequestId = bookingId;
            }

            workerService.submitRating(scoRequestId, rating, feedback);

            // Also mark the CustomerServiceModel as rated for the UI
            if (booking != null) {
                booking.setStatus("COMPLETED"); // already completed; ensure field is set
                customerServiceRepo.save(booking);
            }

            return ResponseEntity.ok(Map.of("message", "Rating submitted successfully"));

        } catch (IllegalStateException e) {
            // Already rated or job not completed
            return ResponseEntity.status(409).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // ── 5. Service center discovery ───────────────────────────────────────────

    /**
     * GET /api/services/centers
     * All APPROVED service centers for the customer booking flow.
     */
    @GetMapping("/centers")
    public ResponseEntity<?> getApprovedServiceCenters() {
        try {
            List<ServiceCenterRegistration> centers =
                    serviceCenterRepo.findByApprovalStatus(ApprovalStatus.APPROVED);

            List<Map<String, Object>> result = centers.stream().map(c -> {
                String ownerId = userRepository.findByEmail(c.getEmail())
                        .map(u -> u.getId()).orElse(null);

                long serviceCount = ownerId != null ? scoServiceRepo.countByServiceCenterId(ownerId)  : 0;
                long workerCount  = ownerId != null ? scoWorkerRepo.countByServiceCenterId(ownerId)   : 0;

                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id",               c.getId());
                m.put("ownerId",          ownerId);
                m.put("centerName",       c.getCenterName());
                m.put("centerType",       c.getCenterType());
                m.put("address",          c.getAddress());
                m.put("city",             c.getCity());
                m.put("state",            c.getState());
                m.put("pincode",          c.getPincode());
                m.put("landmark",         c.getLandmark());
                m.put("openTime",         c.getOpenTime());
                m.put("closeTime",        c.getCloseTime());
                m.put("openDays",         c.getOpenDays());
                m.put("emergencyService", c.isEmergencyService());
                m.put("vehicleTypes",     c.getVehicleTypes());
                m.put("serviceCount",     serviceCount);
                m.put("workerCount",      workerCount);
                m.put("yearsInBusiness",  c.getYearsInBusiness());
                m.put("totalBays",        c.getTotalBays());
                return m;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/services/centers/{ownerId}/services
     * Active services offered by this service center.
     */
    @GetMapping("/centers/{ownerId}/services")
    public ResponseEntity<?> getServiceCenterServices(@PathVariable String ownerId) {
        try {
            List<SCOService> services =
                    scoServiceRepo.findByServiceCenterIdAndActive(ownerId, true);
            return ResponseEntity.ok(services);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/services/centers/{ownerId}/suggested-workers?serviceIds=id1,id2
     * AVAILABLE workers sorted by skill-match score.
     * Also used by NearbyWorkersMap to show workers with their ratings.
     */
    @GetMapping("/centers/{ownerId}/suggested-workers")
    public ResponseEntity<?> getSuggestedWorkers(
            @PathVariable String ownerId,
            @RequestParam(required = false) String serviceIds) {
        try {
            Set<String> requiredSkills = new HashSet<>();
            if (serviceIds != null && !serviceIds.isBlank()) {
                for (String sid : serviceIds.split(",")) {
                    scoServiceRepo.findById(sid.trim()).ifPresent(svc -> {
                        if (svc.getCategory() != null) requiredSkills.add(normaliseSkill(svc.getCategory()));
                        requiredSkills.add(normaliseSkill(svc.getName()));
                    });
                }
            }

            List<SCOWorker> available =
                    scoWorkerRepo.findByServiceCenterIdAndAvailability(ownerId, "AVAILABLE");

            List<Map<String, Object>> scored = available.stream().map(w -> {
                List<String> workerSkills = w.getSkills() != null ? w.getSkills() : List.of();
                long matchScore = workerSkills.stream()
                        .filter(sk -> requiredSkills.contains(normaliseSkill(sk)))
                        .count();

                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id",           w.getId());
                m.put("name",         w.getName());
                m.put("role",         w.getRole());
                m.put("phone",        w.getPhone());
                m.put("skills",       workerSkills);
                m.put("availability", w.getAvailability());
                m.put("completedJobs",w.getCompletedJobs());
                m.put("rating",       w.getRating() != null ? w.getRating() : 0.0);
                m.put("matchScore",   matchScore);
                m.put("isTopMatch",   !requiredSkills.isEmpty() && matchScore > 0);
                return m;
            }).sorted((a, b) ->
                Long.compare((Long) b.get("matchScore"), (Long) a.get("matchScore"))
            ).collect(Collectors.toList());

            return ResponseEntity.ok(scored);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    private String normaliseSkill(String raw) {
        if (raw == null) return "";
        return raw.toUpperCase().replace(" ", "_").replace("-", "_");
    }
}