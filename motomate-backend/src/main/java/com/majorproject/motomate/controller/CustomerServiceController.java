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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.logging.Logger;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/services")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class CustomerServiceController {
    
    @Autowired
    private CustomerService customerServiceService;

    @Autowired
    private ServiceCenterRegistrationRepository serviceCenterRepo;

    @Autowired
    private SCOServiceRepository scoServiceRepo;

    @Autowired
    private SCOWorkerRepository scoWorkerRepo;

    @Autowired
    private UserRepository userRepository;
    
    // 1. Create service booking
    @PostMapping("/book-service")
    public ResponseEntity<?> createService(@RequestBody CustomerServiceModel customerService) {
        Logger logger = Logger.getLogger(CustomerServiceController.class.getName());
        try {
            CustomerServiceModel created = customerServiceService.createService(customerService);
            return new ResponseEntity<>(created, HttpStatus.CREATED);
        } catch (Exception e) {
            logger.severe("Error creating service: " + e.getMessage());
            return new ResponseEntity<>("Error: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    // 2. Get all bookings
    @GetMapping("/all")
    public ResponseEntity<List<CustomerServiceModel>> getAllServices() {
        try {
            return new ResponseEntity<>(customerServiceService.getAllServices(), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }
    
    // 3. Edit booking
    @PutMapping("/edit/{id}")
    public ResponseEntity<?> editService(@PathVariable String id, @RequestBody CustomerServiceModel customerService) {
        try {
            CustomerServiceModel updated = customerServiceService.editService(id, customerService);
            if (updated != null) return new ResponseEntity<>(updated, HttpStatus.OK);
            return new ResponseEntity<>("Service not found", HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Error: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ─── CUSTOMER-FACING SERVICE CENTER DISCOVERY ───────────────────────────

    /**
     * GET /api/services/centers
     * Returns all APPROVED service centers for customer browsing.
     */
    @GetMapping("/centers")
    public ResponseEntity<?> getApprovedServiceCenters() {
        try {
            List<ServiceCenterRegistration> centers = serviceCenterRepo.findByApprovalStatus(ApprovalStatus.APPROVED);
            List<Map<String, Object>> result = centers.stream().map(c -> {
                // Find the UserModel that corresponds to this service center's email
                String ownerId = userRepository.findByEmail(c.getEmail())
                    .map(u -> u.getId()).orElse(null);

                long serviceCount = ownerId != null ? scoServiceRepo.countByServiceCenterId(ownerId) : 0;
                long workerCount  = ownerId != null ? scoWorkerRepo.countByServiceCenterId(ownerId) : 0;

                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id",              c.getId());
                m.put("ownerId",         ownerId);
                m.put("centerName",      c.getCenterName());
                m.put("centerType",      c.getCenterType());
                m.put("address",         c.getAddress());
                m.put("city",            c.getCity());
                m.put("state",           c.getState());
                m.put("pincode",         c.getPincode());
                m.put("landmark",        c.getLandmark());
                m.put("openTime",        c.getOpenTime());
                m.put("closeTime",       c.getCloseTime());
                m.put("openDays",        c.getOpenDays());
                m.put("emergencyService",c.isEmergencyService());
                m.put("vehicleTypes",    c.getVehicleTypes());
                m.put("serviceCount",    serviceCount);
                m.put("workerCount",     workerCount);
                m.put("yearsInBusiness", c.getYearsInBusiness());
                m.put("totalBays",       c.getTotalBays());
                return m;
            }).collect(Collectors.toList());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/services/centers/{ownerId}/services
     * Returns active services for the given service center (by owner userId).
     */
    @GetMapping("/centers/{ownerId}/services")
    public ResponseEntity<?> getServiceCenterServices(@PathVariable String ownerId) {
        try {
            List<SCOService> services = scoServiceRepo.findByServiceCenterIdAndActive(ownerId, true);
            return ResponseEntity.ok(services);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/services/centers/{ownerId}/suggested-workers?serviceIds=id1,id2
     * Returns available workers sorted by skill match score (most matched first).
     * Used by SCO owner when accepting/assigning a request.
     */
    @GetMapping("/centers/{ownerId}/suggested-workers")
    public ResponseEntity<?> getSuggestedWorkers(
            @PathVariable String ownerId,
            @RequestParam(required = false) String serviceIds) {

        try {
            // Determine which skill tags are required by the requested services
            Set<String> requiredSkills = new HashSet<>();
            if (serviceIds != null && !serviceIds.isBlank()) {
                for (String sid : serviceIds.split(",")) {
                    scoServiceRepo.findById(sid.trim()).ifPresent(svc -> {
                        if (svc.getCategory() != null) {
                            requiredSkills.add(normaliseSkill(svc.getCategory()));
                        }
                        requiredSkills.add(normaliseSkill(svc.getName()));
                    });
                }
            }

            List<SCOWorker> available = scoWorkerRepo.findByServiceCenterIdAndAvailability(ownerId, "AVAILABLE");

            // Score each worker by how many required skills they have
            List<Map<String, Object>> scored = available.stream().map(w -> {
                List<String> workerSkills = w.getSkills() != null ? w.getSkills() : List.of();
                long matchScore = workerSkills.stream()
                    .filter(sk -> requiredSkills.contains(normaliseSkill(sk)))
                    .count();

                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id",           w.getId());
                m.put("name",         w.getName());
                m.put("role",         w.getRole());
                m.put("skills",       workerSkills);
                m.put("availability", w.getAvailability());
                m.put("completedJobs",w.getCompletedJobs());
                m.put("rating",       w.getRating());
                m.put("matchScore",   matchScore);
                m.put("isTopMatch",   !requiredSkills.isEmpty() && matchScore > 0);
                return m;
            }).sorted((a, b) -> Long.compare((Long) b.get("matchScore"), (Long) a.get("matchScore")))
              .collect(Collectors.toList());

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