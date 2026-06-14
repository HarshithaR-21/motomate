package com.majorproject.motomate.service;

import com.majorproject.motomate.dto.SOSDTOs;
import com.majorproject.motomate.model.CustomerEmergencyContacts;
import com.majorproject.motomate.model.SCOWorker;
import com.majorproject.motomate.model.SOSRequest;
import com.majorproject.motomate.model.ServiceCenterRegistration;
import com.majorproject.motomate.model.UserModel;
import com.majorproject.motomate.model.WorkerLocation;
import com.majorproject.motomate.enums.ApprovalStatus;
import com.majorproject.motomate.realtime.SseNotificationService;
import com.majorproject.motomate.repository.CustomerEmergencyContactsRepository;
import com.majorproject.motomate.repository.SCOWorkerRepository;
import com.majorproject.motomate.repository.SOSRequestRepository;
import com.majorproject.motomate.repository.ServiceCenterRegistrationRepository;
import com.majorproject.motomate.repository.UserRepository;
import com.majorproject.motomate.repository.WorkerLocationRepository;
import com.majorproject.motomate.util.HaversineUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.logging.Logger;
import java.util.stream.Collectors;

@Service
public class SOSService {

    private static final Logger log = Logger.getLogger(SOSService.class.getName());

    /** Average assumed speed for ETA (km/h) */
    private static final double AVG_SPEED_KMH = 30.0;

    /**
     * All statuses where a worker is actively occupied on an SOS.
     * Used to prevent double-assignment and to count "active" SOS requests.
     */
    private static final List<String> WORKER_BUSY_STATUSES = List.of(
            "WORKER_ASSIGNED", "WORKER_EN_ROUTE", "WORKER_ARRIVED", "SERVICE_IN_PROGRESS"
    );

    /** All non-terminal SOS statuses (not COMPLETED or CANCELLED). */
    private static final List<String> ACTIVE_STATUSES = List.of(
            "SOS_SUBMITTED", "SERVICE_CENTER_ACCEPTED",
            "WORKER_ASSIGNED", "WORKER_EN_ROUTE",
            "WORKER_ARRIVED", "SERVICE_IN_PROGRESS"
    );

    /** Terminal SOS statuses. */
    private static final List<String> TERMINAL_STATUSES = List.of(
            "SERVICE_COMPLETED", "CANCELLED"
    );

    /** All statuses (active + terminal) — used when a service center needs to see its full history. */
    private static final List<String> ALL_STATUSES;
    static {
        List<String> all = new java.util.ArrayList<>(ACTIVE_STATUSES);
        all.addAll(TERMINAL_STATUSES);
        ALL_STATUSES = List.copyOf(all);
    }

    @Autowired private SOSRequestRepository         sosRepo;
    @Autowired private ServiceCenterRegistrationRepository scRepo;
    @Autowired private SCOWorkerRepository          workerRepo;
    @Autowired private WorkerLocationRepository     locationRepo;
    @Autowired private UserRepository               userRepo;
    @Autowired private CustomerEmergencyContactsRepository emergencyContactsRepo;
    @Autowired private SseNotificationService        sseService;

    // ─────────────────────────────────────────────────────────────────────────
    //  1. Submit SOS Request
    // ─────────────────────────────────────────────────────────────────────────

    public SOSDTOs.SOSResponse submitSOS(SOSDTOs.SOSCreateRequest req) {

        // ── Guard: prevent duplicate active SOS from same customer ────────────
        List<SOSRequest> existingActive =
                sosRepo.findByCustomerIdAndStatusIn(req.customerId, ACTIVE_STATUSES);

        if (!existingActive.isEmpty()) {
            SOSRequest existing = existingActive.get(0);
            log.warning("[SOS] Customer " + req.customerId +
                    " already has active SOS: " + existing.getId() +
                    " status=" + existing.getStatus());
            throw new IllegalStateException("ACTIVE_SOS_EXISTS:" + existing.getId());
        }

        // ── Resolve customer details ──────────────────────────────────────────
        UserModel customer = userRepo.findById(req.customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found: " + req.customerId));

        // ── Snapshot emergency contacts ───────────────────────────────────────
        List<SOSRequest.EmergencyContact> contacts = emergencyContactsRepo
                .findByCustomerId(req.customerId)
                .map(c -> c.getContacts().stream()
                        .map(ec -> new SOSRequest.EmergencyContact(
                                ec.getName(), ec.getPhone(), ec.getRelation()))
                        .collect(Collectors.toList()))
                .orElse(Collections.emptyList());

        // ── Priority ──────────────────────────────────────────────────────────
        int score = calculatePriorityScore(
                req.emergencyType, req.vehicleStatus, req.trafficImpact, req.injuryStatus);
        String level = classifyPriority(score);

        // ── Unique chat room ID ───────────────────────────────────────────────
        String chatRoomId = "sos-" + req.customerId + "-" + System.currentTimeMillis();

        // ── Build and save the SOS document ──────────────────────────────────
        SOSRequest sos = SOSRequest.builder()
                .customerId(req.customerId)
                .customerName(customer.getName())
                .customerPhone(customer.getPhone())
                .customerEmail(customer.getEmail())
                .vehicleNumber(req.vehicleNumber != null
                        ? req.vehicleNumber.trim().toUpperCase() : null)
                .vehicleType(req.vehicleType)
                .vehicleBrand(req.vehicleBrand)
                .vehicleModel(req.vehicleModel)
                .emergencyType(req.emergencyType)
                .vehicleStatus(req.vehicleStatus)
                .trafficImpact(req.trafficImpact)
                .injuryStatus(req.injuryStatus)
                .additionalDescription(req.additionalDescription)
                .latitude(req.latitude)
                .longitude(req.longitude)
                .address(req.address)
                .priorityScore(score)
                .priorityLevel(level)
                .status("SOS_SUBMITTED")
                .emergencyContacts(contacts)
                .chatRoomId(chatRoomId)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        sos = sosRepo.save(sos);
        log.info("[SOS] Created SOS " + sos.getId() +
                " priority=" + level + " score=" + score);

        // ── Notify customer immediately that SOS was received ─────────────────
        notifyQuiet(sos.getCustomerId(), "SOS_SUBMITTED",
                Map.of("sosId", sos.getId(), "priority", level, "chatRoomId", chatRoomId));

        // ── Broadcast to all eligible service centers ──────────────────────────
        //    The customer is NOT pre-matched with a single center anymore.
        //    Every eligible approved center sees this SOS in their "incoming"
        //    list and can Accept or Reject it. Whoever accepts first wins.
        sos = broadcastToServiceCenters(sos);

        // ── Reload final state and return ─────────────────────────────────────
        WorkerLocation loc = (sos.getAssignedWorkerId() != null)
                ? locationRepo.findByWorkerId(sos.getAssignedWorkerId()).orElse(null)
                : null;

        SOSDTOs.SOSResponse resp = toResponse(sos, loc);
        log.info("[SOS] submitSOS returning status=" + sos.getStatus() +
                " notifiedCenters=" + (sos.getNotifiedServiceCenterIds() != null
                        ? sos.getNotifiedServiceCenterIds().size() : 0));
        return resp;
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  2. Priority Score Calculation
    // ─────────────────────────────────────────────────────────────────────────

    public int calculatePriorityScore(String emergencyType, String vehicleStatus,
                                       String trafficImpact, String injuryStatus) {
        int score = 0;

        if (emergencyType != null) {
            score += switch (emergencyType.toUpperCase()) {
                case "ACCIDENT"          -> 100;
                case "VEHICLE_BREAKDOWN" -> 80;
                case "ENGINE_FAILURE"    -> 70;
                case "SAFETY_CONCERN"    -> 60;
                case "BATTERY_DEAD"      -> 50;
                case "FLAT_TYRE"         -> 40;
                case "FUEL_EMPTY"        -> 30;
                default                  -> 20;
            };
        }

        if (vehicleStatus != null) {
            score += switch (vehicleStatus.toUpperCase()) {
                case "CANNOT_MOVE" -> 50;
                case "MOVE_SLOWLY" -> 20;
                default            -> 0;
            };
        }

        if ("BLOCKING_TRAFFIC".equalsIgnoreCase(trafficImpact)) score += 40;
        if ("INJURED".equalsIgnoreCase(injuryStatus))           score += 100;

        return score;
    }

    public String classifyPriority(int score) {
        if (score >= 121) return "EMERGENCY";
        if (score >= 61)  return "HIGH";
        return "NORMAL";
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  3. Broadcast SOS to eligible service centers → returns updated SOS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Broadcasts a freshly-submitted SOS to every eligible APPROVED service
     * center so they can each Accept or Reject it from their SOS dashboard.
     *
     * Preference order:
     *  - Step 1: all APPROVED centers with `emergencyService = true`.
     *  - Step 2: if none have emergencyService enabled, fall back to ALL
     *            APPROVED centers (so the SOS is never stranded with nobody
     *            to respond to it).
     *
     * Stores the resolved SCO `users._id` values (NOT the registration ids)
     * in `notifiedServiceCenterIds`, because that is the id used by
     * sco_workers.serviceCenterId, the SSE subscription key, and the
     * frontend's `localStorage.getItem("userId")`.
     */
    private SOSRequest broadcastToServiceCenters(SOSRequest sos) {
        if (sos.getLatitude() == null || sos.getLongitude() == null) {
            log.warning("[SOS] Cannot broadcast: SOS has no location. id=" + sos.getId());
            return sos;
        }

        double sosLat = sos.getLatitude();
        double sosLon = sos.getLongitude();

        // All APPROVED centers with coordinates
        List<ServiceCenterRegistration> allApproved = scRepo
                .findByApprovalStatus(ApprovalStatus.APPROVED)
                .stream()
                .filter(sc -> sc.getLatitude() != null && sc.getLongitude() != null)
                .collect(Collectors.toList());

        if (allApproved.isEmpty()) {
            log.warning("[SOS] No approved service centers with coordinates. id=" + sos.getId());
            return sos;
        }

        // ── Step 1: emergency-enabled centers ──────────────────────────────────
        List<ServiceCenterRegistration> targets = allApproved.stream()
                .filter(ServiceCenterRegistration::isEmergencyService)
                .collect(Collectors.toList());

        // ── Step 2: fall back to ALL approved centers ─────────────────────────
        if (targets.isEmpty()) {
            log.warning("[SOS] No emergency-enabled centers — broadcasting to all approved centers");
            targets = allApproved;
        }

        // Sort nearest-first (purely informational for logging / distance payload)
        targets = targets.stream()
                .sorted(Comparator.comparingDouble(sc ->
                        HaversineUtil.calculate(sosLat, sosLon, sc.getLatitude(), sc.getLongitude())))
                .collect(Collectors.toList());

        List<String> notifiedIds = new ArrayList<>();
        for (ServiceCenterRegistration sc : targets) {
            String scoUserId = resolveScoUserId(sc);
            double distKm = HaversineUtil.calculate(
                    sosLat, sosLon, sc.getLatitude(), sc.getLongitude());

            notifiedIds.add(scoUserId);

            notifyQuiet(scoUserId, "NEW_SOS_REQUEST",
                    Map.of("sosId", sos.getId(),
                           "priority", sos.getPriorityLevel(),
                           "customerName", sos.getCustomerName(),
                           "emergencyType", sos.getEmergencyType(),
                           "distanceKm", String.format("%.1f", distKm)));
        }

        log.info("[SOS] Broadcast " + sos.getId() + " to " + notifiedIds.size() +
                " service center(s) (emergency-only=" + (targets != allApproved) + ")");

        sos.setNotifiedServiceCenterIds(notifiedIds);
        sos.setUpdatedAt(LocalDateTime.now());
        return sosRepo.save(sos);
    }

    /**
     * Called when every previously-notified center has rejected an SOS that's
     * still SOS_SUBMITTED. Re-broadcasts to any APPROVED center that hasn't
     * seen it yet, so the request isn't permanently stranded.
     */
    private SOSRequest expandBroadcast(SOSRequest sos) {
        if (sos.getLatitude() == null || sos.getLongitude() == null) return sos;

        Set<String> alreadyNotified = sos.getNotifiedServiceCenterIds() != null
                ? new HashSet<>(sos.getNotifiedServiceCenterIds())
                : new HashSet<>();

        List<ServiceCenterRegistration> remaining = scRepo
                .findByApprovalStatus(ApprovalStatus.APPROVED)
                .stream()
                .filter(sc -> sc.getLatitude() != null && sc.getLongitude() != null)
                .filter(sc -> !alreadyNotified.contains(resolveScoUserId(sc)))
                .collect(Collectors.toList());

        if (remaining.isEmpty()) {
            log.warning("[SOS] All approved centers have rejected/seen SOS " + sos.getId() +
                    " — customer remains in queue.");
            notifyQuiet(sos.getCustomerId(), "SOS_NO_RESPONSE",
                    Map.of("sosId", sos.getId(),
                           "message", "No service center has responded yet. We'll keep trying."));
            return sos;
        }

        double sosLat = sos.getLatitude();
        double sosLon = sos.getLongitude();
        List<String> notifiedIds = new ArrayList<>(sos.getNotifiedServiceCenterIds() != null
                ? sos.getNotifiedServiceCenterIds() : List.of());

        for (ServiceCenterRegistration sc : remaining) {
            String scoUserId = resolveScoUserId(sc);
            double distKm = HaversineUtil.calculate(
                    sosLat, sosLon, sc.getLatitude(), sc.getLongitude());

            notifiedIds.add(scoUserId);
            notifyQuiet(scoUserId, "NEW_SOS_REQUEST",
                    Map.of("sosId", sos.getId(),
                           "priority", sos.getPriorityLevel(),
                           "customerName", sos.getCustomerName(),
                           "emergencyType", sos.getEmergencyType(),
                           "distanceKm", String.format("%.1f", distKm)));
        }

        log.info("[SOS] Expanded broadcast for " + sos.getId() + " to " + remaining.size() + " more center(s)");

        sos.setNotifiedServiceCenterIds(notifiedIds);
        sos.setUpdatedAt(LocalDateTime.now());
        return sosRepo.save(sos);
    }

    /**
     * Resolves the SCO's `users._id` (NOT the ServiceCenterRegistration._id)
     * by looking up the registration's email in the users collection.
     * This is the id used by sco_workers.serviceCenterId, SSE subscriptions,
     * and the frontend's `localStorage.getItem("userId")`.
     */
    private String resolveScoUserId(ServiceCenterRegistration sc) {
        return userRepo.findByEmail(sc.getEmail())
                .map(UserModel::getId)
                .orElse(sc.getId()); // safe fallback: registration id if no user found
    }

    /** Resolves a human-friendly center name from the SCO's users._id. */
    private String resolveServiceCenterName(String scoUserId) {
        return userRepo.findById(scoUserId)
                .flatMap(u -> scRepo.findByEmail(u.getEmail()))
                .map(ServiceCenterRegistration::getCenterName)
                .orElseGet(() -> scRepo.findById(scoUserId)
                        .map(ServiceCenterRegistration::getCenterName)
                        .orElse("Service Center"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  4. Auto-assign Nearest Available Worker → returns updated SOS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Auto-assigns the nearest AVAILABLE worker belonging to the service
     * center that just accepted this SOS. If no worker is free right now,
     * the SOS simply stays at SERVICE_CENTER_ACCEPTED and the SCO dashboard
     * shows the "Assign Worker" action so they can pick one manually once
     * someone frees up (or assign across roles themselves).
     *
     * Deliberately does NOT search other service centers — once a center has
     * accepted an SOS, that center owns it.
     */
    private SOSRequest assignNearestWorker(SOSRequest sos, String primaryServiceCenterId) {

        double sosLat = sos.getLatitude();
        double sosLon = sos.getLongitude();

        // ── Candidate workers from the accepting center ────────────────────────
        List<SCOWorker> candidates = freeAvailableWorkers(primaryServiceCenterId);

        if (candidates.isEmpty()) {
            log.info("[SOS] No free workers in center " + primaryServiceCenterId +
                    " right now — SOS remains at SERVICE_CENTER_ACCEPTED, SCO must assign manually");
            return sos;
        }

        // ── Pick nearest by GPS, fall back to first available ─────────────────
        SCOWorker nearest = null;
        double minDist = Double.MAX_VALUE;

        for (SCOWorker w : candidates) {
            Optional<WorkerLocation> locOpt = locationRepo.findByWorkerId(w.getId());
            if (locOpt.isPresent() && locOpt.get().isActive()) {
                double dist = HaversineUtil.calculate(
                        sosLat, sosLon,
                        locOpt.get().getLatitude(),
                        locOpt.get().getLongitude());
                if (dist < minDist) {
                    minDist = dist;
                    nearest = w;
                }
            }
        }

        // No worker has shared location → just pick first available
        if (nearest == null) {
            nearest = candidates.get(0);
            log.info("[SOS] No worker GPS available; picking first available: " + nearest.getName());
        } else {
            log.info("[SOS] Nearest worker: " + nearest.getName() +
                    " dist=" + String.format("%.2f", minDist) + "km");
        }

        // ── Assign & mark BUSY atomically ─────────────────────────────────────
        sos.setAssignedWorkerId(nearest.getId());
        sos.setAssignedWorkerName(nearest.getName());
        sos.setAssignedWorkerPhone(nearest.getPhone());
        sos.setStatus("WORKER_ASSIGNED");
        sos.setWorkerAssignedAt(LocalDateTime.now());
        sos.setUpdatedAt(LocalDateTime.now());
        sos = sosRepo.save(sos);

        nearest.setAvailability("BUSY");
        workerRepo.save(nearest);

        log.info("[SOS] Worker assigned: " + nearest.getName() +
                " id=" + nearest.getId() + " to SOS=" + sos.getId());

        // Notify worker
        String workerUserId = nearest.getWorkerUserId();
        if (workerUserId != null) {
            notifyQuiet(workerUserId, "SOS_ASSIGNMENT",
                    Map.of("sosId", sos.getId(),
                           "customerName",  sos.getCustomerName(),
                           "customerPhone", sos.getCustomerPhone() != null ? sos.getCustomerPhone() : "",
                           "emergencyType", sos.getEmergencyType(),
                           "priority",      sos.getPriorityLevel(),
                           "address",       sos.getAddress() != null ? sos.getAddress() : "",
                           "latitude",      String.valueOf(sosLat),
                           "longitude",     String.valueOf(sosLon),
                           "chatRoomId",    sos.getChatRoomId() != null ? sos.getChatRoomId() : ""));
        } else {
            log.warning("[SOS] Worker " + nearest.getId() + " has no workerUserId; cannot send SSE");
        }

        // Notify customer
        notifyQuiet(sos.getCustomerId(), "WORKER_ASSIGNED",
                Map.of("workerName",  nearest.getName(),
                       "workerPhone", nearest.getPhone() != null ? nearest.getPhone() : "",
                       "chatRoomId",  sos.getChatRoomId() != null ? sos.getChatRoomId() : "",
                       "sosId",       sos.getId()));

        return sos;
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Helper: workers who are AVAILABLE and not already on an active SOS
    // ─────────────────────────────────────────────────────────────────────────

    private List<SCOWorker> freeAvailableWorkers(String serviceCenterId) {
        return workerRepo
                .findByServiceCenterIdAndAvailability(serviceCenterId, "AVAILABLE")
                .stream()
                // Exclude anyone already holding an active SOS assignment
                .filter(w -> sosRepo.countByAssignedWorkerIdAndStatusIn(
                        w.getId(), WORKER_BUSY_STATUSES) == 0)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  5. Worker: Update Status
    // ─────────────────────────────────────────────────────────────────────────

    public SOSDTOs.SOSResponse updateStatus(String sosId, String newStatus, String workerId) {
        SOSRequest sos = sosRepo.findById(sosId)
                .orElseThrow(() -> new RuntimeException("SOS not found: " + sosId));

        if (!workerId.equals(sos.getAssignedWorkerId())) {
            throw new IllegalArgumentException("Worker is not assigned to this SOS");
        }

        validateStatusTransition(sos.getStatus(), newStatus);

        sos.setStatus(newStatus);
        sos.setUpdatedAt(LocalDateTime.now());

        if ("WORKER_ARRIVED".equals(newStatus))    sos.setWorkerArrivedAt(LocalDateTime.now());
        if ("SERVICE_COMPLETED".equals(newStatus)) {
            sos.setServiceCompletedAt(LocalDateTime.now());
            workerRepo.findById(sos.getAssignedWorkerId()).ifPresent(w -> {
                w.setAvailability("AVAILABLE");
                workerRepo.save(w);
                log.info("[SOS] Worker " + w.getName() + " freed after SERVICE_COMPLETED");
            });
        }

        sosRepo.save(sos);

        // Notify customer
        Map<String, Object> payload = new HashMap<>();
        payload.put("status", newStatus);
        payload.put("sosId", sosId);
        if (sos.getAssignedWorkerName() != null) payload.put("workerName", sos.getAssignedWorkerName());
        if (sos.getChatRoomId() != null)         payload.put("chatRoomId", sos.getChatRoomId());
        notifyQuiet(sos.getCustomerId(), "SOS_STATUS_UPDATE", payload);

        // Notify service center
        if (sos.getAssignedServiceCenterId() != null) {
            notifyQuiet(sos.getAssignedServiceCenterId(), "SOS_STATUS_UPDATE",
                    Map.of("status", newStatus, "sosId", sosId,
                           "workerName", sos.getAssignedWorkerName() != null
                                   ? sos.getAssignedWorkerName() : ""));
        }

        WorkerLocation workerLoc = locationRepo.findByWorkerId(workerId).orElse(null);
        return toResponse(sos, workerLoc);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  6. Cancel SOS (customer)
    // ─────────────────────────────────────────────────────────────────────────

    public SOSDTOs.SOSResponse cancelSOS(String sosId, String customerId, String reason) {
        SOSRequest sos = sosRepo.findById(sosId)
                .orElseThrow(() -> new RuntimeException("SOS not found: " + sosId));

        if (!customerId.equals(sos.getCustomerId())) {
            throw new IllegalArgumentException("Not authorized to cancel this SOS");
        }
        if ("SERVICE_COMPLETED".equals(sos.getStatus()) || "CANCELLED".equals(sos.getStatus())) {
            throw new IllegalArgumentException("Cannot cancel: already " + sos.getStatus());
        }

        // Free worker
        if (sos.getAssignedWorkerId() != null) {
            workerRepo.findById(sos.getAssignedWorkerId()).ifPresent(w -> {
                w.setAvailability("AVAILABLE");
                workerRepo.save(w);
            });
            // Notify worker
            workerRepo.findById(sos.getAssignedWorkerId()).ifPresent(w -> {
                if (w.getWorkerUserId() != null) {
                    notifyQuiet(w.getWorkerUserId(), "SOS_CANCELLED",
                            Map.of("sosId", sosId,
                                   "reason", reason != null ? reason : "Customer cancelled"));
                }
            });
        }

        if (sos.getAssignedServiceCenterId() != null) {
            notifyQuiet(sos.getAssignedServiceCenterId(), "SOS_CANCELLED",
                    Map.of("sosId", sosId, "customerName", sos.getCustomerName()));
        }

        sos.setStatus("CANCELLED");
        sos.setCancellationReason(reason);
        sos.setUpdatedAt(LocalDateTime.now());
        sosRepo.save(sos);

        return toResponse(sos, null);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  7. Get SOS by ID
    // ─────────────────────────────────────────────────────────────────────────

    public SOSDTOs.SOSResponse getById(String sosId) {
        SOSRequest sos = sosRepo.findById(sosId)
                .orElseThrow(() -> new RuntimeException("SOS not found: " + sosId));
        WorkerLocation loc = (sos.getAssignedWorkerId() != null)
                ? locationRepo.findByWorkerId(sos.getAssignedWorkerId()).orElse(null)
                : null;
        return toResponse(sos, loc);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  8. Customer: SOS history
    // ─────────────────────────────────────────────────────────────────────────

    public List<SOSDTOs.SOSResponse> getByCustomer(String customerId) {
        return sosRepo.findByCustomerIdOrderByCreatedAtDesc(customerId)
                .stream().map(s -> toResponse(s, null)).collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  9. Service Center: active SOS sorted by priority
    // ─────────────────────────────────────────────────────────────────────────

    public List<SOSDTOs.SOSResponse> getActiveForServiceCenter(String serviceCenterId) {
        return sosRepo.findByAssignedServiceCenterIdAndStatusIn(serviceCenterId, ACTIVE_STATUSES)
                .stream()
                .sorted(Comparator
                        .comparingInt((SOSRequest s) -> -s.getPriorityScore())
                        .thenComparing(SOSRequest::getCreatedAt))
                .map(s -> {
                    WorkerLocation loc = (s.getAssignedWorkerId() != null)
                            ? locationRepo.findByWorkerId(s.getAssignedWorkerId()).orElse(null)
                            : null;
                    return toResponse(s, loc);
                })
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  9b. Service Center: incoming SOS (broadcast pending + accepted/active + history)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Returns everything a service center's SOS dashboard needs in one call:
     *  - SOS requests broadcast to this center that are still SOS_SUBMITTED
     *    and this center hasn't rejected yet (pending — can Accept/Reject)
     *  - SOS requests this center has already accepted, at any stage
     *    (active or in history: SERVICE_COMPLETED / CANCELLED)
     */
    public List<SOSDTOs.SOSResponse> getIncomingForServiceCenter(String serviceCenterId) {
        Map<String, SOSRequest> byId = new LinkedHashMap<>();

        // ── Pending broadcasts not yet rejected by this center ─────────────────
        sosRepo.findByNotifiedServiceCenterIdsContainingAndStatus(serviceCenterId, "SOS_SUBMITTED")
                .stream()
                .filter(s -> s.getRejectedServiceCenterIds() == null
                        || !s.getRejectedServiceCenterIds().contains(serviceCenterId))
                .forEach(s -> byId.put(s.getId(), s));

        // ── Everything this center has accepted (active or completed/cancelled) ─
        sosRepo.findByAssignedServiceCenterIdAndStatusIn(serviceCenterId, ALL_STATUSES)
                .forEach(s -> byId.putIfAbsent(s.getId(), s));

        return byId.values().stream()
                .sorted(Comparator
                        .comparingInt((SOSRequest s) -> -s.getPriorityScore())
                        .thenComparing(SOSRequest::getCreatedAt))
                .map(s -> {
                    WorkerLocation loc = (s.getAssignedWorkerId() != null)
                            ? locationRepo.findByWorkerId(s.getAssignedWorkerId()).orElse(null)
                            : null;
                    return toResponse(s, loc);
                })
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  9c. Service Center: Accept a broadcast SOS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * The first service center to accept "wins" the SOS. All other centers
     * that were notified get an SOS_TAKEN event so it disappears from their
     * pending list. If a worker is immediately available at the accepting
     * center, it's auto-assigned; otherwise the SOS stays at
     * SERVICE_CENTER_ACCEPTED so the SCO can assign one manually.
     */
    public SOSDTOs.SOSResponse acceptSOS(String sosId, String serviceCenterId) {
        SOSRequest sos = sosRepo.findById(sosId)
                .orElseThrow(() -> new RuntimeException("SOS not found: " + sosId));

        if (!"SOS_SUBMITTED".equals(sos.getStatus())) {
            throw new IllegalStateException(
                    "This SOS request has already been handled (current status: " + sos.getStatus() + ")");
        }

        String centerName = resolveServiceCenterName(serviceCenterId);

        sos.setAssignedServiceCenterId(serviceCenterId);
        sos.setAssignedServiceCenterName(centerName);
        sos.setStatus("SERVICE_CENTER_ACCEPTED");
        sos.setUpdatedAt(LocalDateTime.now());
        sos = sosRepo.save(sos);

        log.info("[SOS] " + sosId + " accepted by center=" + centerName + " (id=" + serviceCenterId + ")");

        // Notify customer
        notifyQuiet(sos.getCustomerId(), "SERVICE_CENTER_ACCEPTED",
                Map.of("sosId", sos.getId(),
                       "serviceCenterName", centerName != null ? centerName : "",
                       "chatRoomId", sos.getChatRoomId() != null ? sos.getChatRoomId() : ""));

        // Notify all other notified centers that this SOS has been taken
        if (sos.getNotifiedServiceCenterIds() != null) {
            for (String otherId : sos.getNotifiedServiceCenterIds()) {
                if (!otherId.equals(serviceCenterId)) {
                    notifyQuiet(otherId, "SOS_TAKEN", Map.of("sosId", sos.getId()));
                }
            }
        }

        // Try to immediately assign an available worker from this center
        sos = assignNearestWorker(sos, serviceCenterId);

        WorkerLocation loc = (sos.getAssignedWorkerId() != null)
                ? locationRepo.findByWorkerId(sos.getAssignedWorkerId()).orElse(null)
                : null;
        return toResponse(sos, loc);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  9d. Service Center: Reject a broadcast SOS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Records this center's rejection. If every center that was notified has
     * now rejected (and nobody has accepted yet), the SOS is re-broadcast to
     * any remaining APPROVED centers so the customer isn't left stranded.
     */
    public SOSDTOs.SOSResponse rejectSOS(String sosId, String serviceCenterId, String reason) {
        SOSRequest sos = sosRepo.findById(sosId)
                .orElseThrow(() -> new RuntimeException("SOS not found: " + sosId));

        if (!"SOS_SUBMITTED".equals(sos.getStatus())) {
            throw new IllegalStateException(
                    "This SOS request is no longer pending (current status: " + sos.getStatus() + ")");
        }

        List<String> rejected = sos.getRejectedServiceCenterIds() != null
                ? new ArrayList<>(sos.getRejectedServiceCenterIds())
                : new ArrayList<>();
        if (!rejected.contains(serviceCenterId)) {
            rejected.add(serviceCenterId);
        }
        sos.setRejectedServiceCenterIds(rejected);
        sos.setUpdatedAt(LocalDateTime.now());
        sos = sosRepo.save(sos);

        log.info("[SOS] " + sosId + " rejected by center=" + serviceCenterId +
                (reason != null && !reason.isBlank() ? " reason=" + reason : ""));

        // If every notified center has now rejected, try to widen the broadcast
        List<String> notified = sos.getNotifiedServiceCenterIds();
        if (notified != null && !notified.isEmpty() && rejected.containsAll(notified)) {
            sos = expandBroadcast(sos);
        }

        return toResponse(sos, null);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  10. Service Center: available workers for manual assignment
    // ─────────────────────────────────────────────────────────────────────────

    public List<SOSDTOs.AvailableWorkerDTO> getAvailableWorkersForSOS(
            String serviceCenterId, Double sosLat, Double sosLon) {

        return workerRepo.findByServiceCenterId(serviceCenterId)
                .stream()
                .filter(w -> "AVAILABLE".equals(w.getAvailability()))
                .filter(w -> sosRepo.countByAssignedWorkerIdAndStatusIn(
                        w.getId(), WORKER_BUSY_STATUSES) == 0)
                .map(w -> {
                    SOSDTOs.AvailableWorkerDTO dto = new SOSDTOs.AvailableWorkerDTO();
                    dto.workerId     = w.getId();
                    dto.workerName   = w.getName();
                    dto.workerPhone  = w.getPhone();
                    dto.availability = w.getAvailability();
                    dto.activeSOSCount = 0;

                    Optional<WorkerLocation> locOpt = locationRepo.findByWorkerId(w.getId());
                    if (locOpt.isPresent() && locOpt.get().isActive()) {
                        dto.latitude  = locOpt.get().getLatitude();
                        dto.longitude = locOpt.get().getLongitude();
                        if (sosLat != null && sosLon != null) {
                            dto.distanceKm = Math.round(
                                    HaversineUtil.calculate(sosLat, sosLon,
                                            dto.latitude, dto.longitude) * 10.0) / 10.0;
                        }
                    }
                    return dto;
                })
                .sorted(Comparator.comparingDouble(
                        dto -> dto.distanceKm != null ? dto.distanceKm : Double.MAX_VALUE))
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  11. Service Center: manually assign a worker
    // ─────────────────────────────────────────────────────────────────────────

    public SOSDTOs.SOSResponse manuallyAssignWorker(String sosId, String workerId) {
        SOSRequest sos = sosRepo.findById(sosId)
                .orElseThrow(() -> new RuntimeException("SOS not found: " + sosId));

        if ("SERVICE_COMPLETED".equals(sos.getStatus()) || "CANCELLED".equals(sos.getStatus())) {
            throw new IllegalArgumentException(
                    "Cannot reassign a " + sos.getStatus().toLowerCase() + " SOS");
        }

        SCOWorker newWorker = workerRepo.findById(workerId)
                .orElseThrow(() -> new IllegalArgumentException("Worker not found: " + workerId));

        // Free old worker if different
        if (sos.getAssignedWorkerId() != null && !sos.getAssignedWorkerId().equals(workerId)) {
            workerRepo.findById(sos.getAssignedWorkerId()).ifPresent(old -> {
                old.setAvailability("AVAILABLE");
                workerRepo.save(old);
                if (old.getWorkerUserId() != null) {
                    notifyQuiet(old.getWorkerUserId(), "SOS_REASSIGNED",
                            Map.of("sosId", sosId,
                                   "message", "You have been unassigned from this SOS"));
                }
            });
        }

        sos.setAssignedWorkerId(newWorker.getId());
        sos.setAssignedWorkerName(newWorker.getName());
        sos.setAssignedWorkerPhone(newWorker.getPhone());
        sos.setStatus("WORKER_ASSIGNED");
        sos.setWorkerAssignedAt(LocalDateTime.now());
        sos.setUpdatedAt(LocalDateTime.now());
        sosRepo.save(sos);

        newWorker.setAvailability("BUSY");
        workerRepo.save(newWorker);

        if (newWorker.getWorkerUserId() != null) {
            notifyQuiet(newWorker.getWorkerUserId(), "SOS_ASSIGNMENT",
                    Map.of("sosId", sos.getId(),
                           "customerName",  sos.getCustomerName(),
                           "customerPhone", sos.getCustomerPhone() != null ? sos.getCustomerPhone() : "",
                           "emergencyType", sos.getEmergencyType(),
                           "priority",      sos.getPriorityLevel(),
                           "address",       sos.getAddress() != null ? sos.getAddress() : "",
                           "chatRoomId",    sos.getChatRoomId() != null ? sos.getChatRoomId() : ""));
        }

        notifyQuiet(sos.getCustomerId(), "WORKER_ASSIGNED",
                Map.of("workerName",  newWorker.getName(),
                       "workerPhone", newWorker.getPhone() != null ? newWorker.getPhone() : "",
                       "chatRoomId",  sos.getChatRoomId() != null ? sos.getChatRoomId() : "",
                       "sosId",       sos.getId()));

        WorkerLocation loc = locationRepo.findByWorkerId(workerId).orElse(null);
        return toResponse(sos, loc);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  12. Worker: active SOS assignments
    // ─────────────────────────────────────────────────────────────────────────

    public List<SOSDTOs.SOSResponse> getActiveForWorker(String workerId) {
        return sosRepo.findByAssignedWorkerIdAndStatusIn(workerId, ACTIVE_STATUSES)
                .stream()
                .map(s -> {
                    WorkerLocation loc = locationRepo.findByWorkerId(workerId).orElse(null);
                    return toResponse(s, loc);
                })
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  13. Emergency Contacts CRUD
    // ─────────────────────────────────────────────────────────────────────────

    public CustomerEmergencyContacts saveEmergencyContacts(
            String customerId,
            List<CustomerEmergencyContacts.EmergencyContact> contacts) {

        CustomerEmergencyContacts doc = emergencyContactsRepo.findByCustomerId(customerId)
                .orElse(CustomerEmergencyContacts.builder().customerId(customerId).build());
        doc.setContacts(contacts);
        return emergencyContactsRepo.save(doc);
    }

    public CustomerEmergencyContacts getEmergencyContacts(String customerId) {
        return emergencyContactsRepo.findByCustomerId(customerId)
                .orElse(CustomerEmergencyContacts.builder()
                        .customerId(customerId)
                        .contacts(Collections.emptyList())
                        .build());
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    private void validateStatusTransition(String current, String next) {
        Map<String, List<String>> allowed = Map.of(
                "WORKER_ASSIGNED",     List.of("WORKER_EN_ROUTE"),
                "WORKER_EN_ROUTE",     List.of("WORKER_ARRIVED"),
                "WORKER_ARRIVED",      List.of("SERVICE_IN_PROGRESS"),
                "SERVICE_IN_PROGRESS", List.of("SERVICE_COMPLETED")
        );
        if (!allowed.getOrDefault(current, List.of()).contains(next)) {
            throw new IllegalArgumentException(
                    "Invalid transition '" + current + "' → '" + next + "'");
        }
    }

    private Long calcETA(double distanceKm) {
        return Math.max(1L, Math.round((distanceKm / AVG_SPEED_KMH) * 60));
    }

    /** Sends an SSE notification, swallows exceptions so they never abort core logic. */
    private void notifyQuiet(String targetId, String event, Map<String, Object> payload) {
        try {
            sseService.sendNotification(targetId, event, payload);
        } catch (Exception e) {
            log.warning("[SOS] SSE notify failed for " + targetId + " event=" + event
                    + " : " + e.getMessage());
        }
    }

    private SOSDTOs.SOSResponse toResponse(SOSRequest sos, WorkerLocation workerLoc) {
        SOSDTOs.SOSResponse r = new SOSDTOs.SOSResponse();
        r.id                        = sos.getId();
        r.customerId                = sos.getCustomerId();
        r.customerName              = sos.getCustomerName();
        r.customerPhone             = sos.getCustomerPhone();
        r.vehicleNumber             = sos.getVehicleNumber();
        r.vehicleType               = sos.getVehicleType();
        r.vehicleBrand              = sos.getVehicleBrand();
        r.vehicleModel              = sos.getVehicleModel();
        r.emergencyType             = sos.getEmergencyType();
        r.vehicleStatus             = sos.getVehicleStatus();
        r.trafficImpact             = sos.getTrafficImpact();
        r.injuryStatus              = sos.getInjuryStatus();
        r.additionalDescription     = sos.getAdditionalDescription();
        r.latitude                  = sos.getLatitude();
        r.longitude                 = sos.getLongitude();
        r.address                   = sos.getAddress();
        r.priorityScore             = sos.getPriorityScore();
        r.priorityLevel             = sos.getPriorityLevel();
        r.assignedServiceCenterId   = sos.getAssignedServiceCenterId();
        r.assignedServiceCenterName = sos.getAssignedServiceCenterName();
        r.assignedWorkerId          = sos.getAssignedWorkerId();
        r.assignedWorkerName        = sos.getAssignedWorkerName();
        r.assignedWorkerPhone       = sos.getAssignedWorkerPhone();
        r.status                    = sos.getStatus();
        r.createdAt                 = sos.getCreatedAt();
        r.updatedAt                 = sos.getUpdatedAt();
        r.workerAssignedAt          = sos.getWorkerAssignedAt();
        r.workerArrivedAt           = sos.getWorkerArrivedAt();
        r.serviceCompletedAt        = sos.getServiceCompletedAt();
        r.chatRoomId                = sos.getChatRoomId();
        r.notifiedServiceCentersCount = sos.getNotifiedServiceCenterIds() != null
                ? sos.getNotifiedServiceCenterIds().size() : 0;

        if (sos.getCreatedAt() != null) {
            r.minutesSinceRequest = ChronoUnit.MINUTES.between(
                    sos.getCreatedAt(), LocalDateTime.now());
        }

        if (workerLoc != null && workerLoc.isActive()
                && sos.getLatitude() != null && sos.getLongitude() != null) {

            r.workerLatitude  = workerLoc.getLatitude();
            r.workerLongitude = workerLoc.getLongitude();

            double dist = HaversineUtil.calculate(
                    sos.getLatitude(), sos.getLongitude(),
                    workerLoc.getLatitude(), workerLoc.getLongitude());
            r.distanceToWorkerKm = Math.round(dist * 10.0) / 10.0;

            if (List.of("WORKER_ASSIGNED", "WORKER_EN_ROUTE").contains(sos.getStatus())) {
                r.estimatedArrivalMinutes = calcETA(dist);
            }
        }

        return r;
    }
}