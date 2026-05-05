package com.majorproject.motomate.service;

import com.majorproject.motomate.dto.LocationDTOs;
import com.majorproject.motomate.model.CustomerServiceModel;
import com.majorproject.motomate.model.SCOWorker;
import com.majorproject.motomate.model.WorkerLocation;
import com.majorproject.motomate.realtime.SseNotificationService;
import com.majorproject.motomate.repository.CustomerServiceRepository;
import com.majorproject.motomate.repository.SCOWorkerRepository;
import com.majorproject.motomate.repository.WorkerLocationRepository;
import com.majorproject.motomate.repository.WorkerServiceRequestRepository;
import com.majorproject.motomate.util.HaversineUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.logging.Logger;

/**
 * Handles all Maps / Location business logic:
 *
 *  1. updateWorkerLocation  — worker pushes GPS; stored in MongoDB + broadcast to customer via SSE
 *  2. assignNearestWorker   — Haversine-based auto-assignment when Doorstep booking is created
 *  3. getWorkerLocation     — customer polls current worker position
 *  4. storeCustomerLocation — saves GPS coords into the booking document
 *  5. deactivateWorkerLocation — marks worker as inactive (job done / off duty)
 */
@Service
public class LocationService {

    private static final Logger log = Logger.getLogger(LocationService.class.getName());

    @Autowired private WorkerLocationRepository   locationRepo;
    @Autowired private SCOWorkerRepository        workerRepo;
    @Autowired private CustomerServiceRepository  customerServiceRepo;
    @Autowired private WorkerServiceRequestRepository requestRepo;
    @Autowired private SseNotificationService     sseService;


    // ── 1. Worker location update ─────────────────────────────────────────────

    /**
     * Called every 5–10 seconds by the worker frontend.
     * Upserts the WorkerLocation document and broadcasts the new position
     * to the customer assigned to this worker's current active job (if any).
     *
     * @param workerId  SCOWorker.id
     * @param lat       new latitude
     * @param lon       new longitude
     */
    public LocationDTOs.WorkerLocationResponse updateWorkerLocation(
            String workerId, Double lat, Double lon) {

        // Fetch worker to get serviceCenterId
        SCOWorker worker = workerRepo.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found: " + workerId));

        // Upsert WorkerLocation document
        WorkerLocation loc = locationRepo.findByWorkerId(workerId)
                .orElse(WorkerLocation.builder()
                        .workerId(workerId)
                        .serviceCenterId(worker.getServiceCenterId())
                        .build());

        loc.setLatitude(lat);
        loc.setLongitude(lon);
        loc.setActive(true);
        loc.setLastUpdatedAt(LocalDateTime.now());
        locationRepo.save(loc);

        // Broadcast to customer (find the customer whose active booking has this worker)
        broadcastLocationToCustomer(workerId, lat, lon);

        return new LocationDTOs.WorkerLocationResponse(
                workerId,
                worker.getServiceCenterId(),
                lat, lon, true,
                LocalDateTime.now().toString());
    }

    // ── 2. Nearest worker assignment (Haversine) ──────────────────────────────

    /**
     * Finds the geographically nearest AVAILABLE worker under the given service
     * center using the Haversine formula, assigns them to the booking, and
     * notifies both parties via SSE.
     *
     * Called from CustomerService.createService() when serviceMode = "Doorstep".
     *
     * @param booking  the saved CustomerServiceModel (must have lat/lon + serviceCenterId)
     * @return the assigned SCOWorker, or empty if none available
     */
    public Optional<SCOWorker> assignNearestWorker(CustomerServiceModel booking) {
        if (booking.getCustomerLatitude() == null || booking.getCustomerLongitude() == null) {
            log.warning("[Haversine] Booking " + booking.getId() + " has no GPS coordinates — skipping auto-assign");
            return Optional.empty();
        }

        String serviceCenterId = booking.getServiceCenterId();
        double custLat = booking.getCustomerLatitude();
        double custLon = booking.getCustomerLongitude();

        // 1. All AVAILABLE workers in this service center
        List<SCOWorker> available = workerRepo
                .findByServiceCenterIdAndAvailability(serviceCenterId, "AVAILABLE");

        if (available.isEmpty()) {
            log.info("[Haversine] No available workers for service center " + serviceCenterId);
            return Optional.empty();
        }

        // 2. For each worker find their location document; compute distance
        SCOWorker nearest = null;
        double minDist = Double.MAX_VALUE;

        for (SCOWorker w : available) {
            Optional<WorkerLocation> locOpt = locationRepo.findByWorkerId(w.getId());
            if (locOpt.isEmpty() || !locOpt.get().isActive()) {
                // Worker has no live location — exclude from distance-based selection
                log.fine("[Haversine] Worker " + w.getId() + " has no active location, skipping");
                continue;
            }
            WorkerLocation wLoc = locOpt.get();
            double dist = HaversineUtil.calculate(custLat, custLon,
                    wLoc.getLatitude(), wLoc.getLongitude());
            log.info("[Haversine] Worker " + w.getName() + " distance = " + dist + " km");
            if (dist < minDist) {
                minDist = dist;
                nearest = w;
            }
        }

        // Fallback: if no worker has a live location, pick any available worker
        if (nearest == null && !available.isEmpty()) {
            nearest = available.get(0);
            log.info("[Haversine] No location data — falling back to first available worker: " + nearest.getId());
        }

        if (nearest == null) return Optional.empty();

        // 3. Mark worker BUSY
        nearest.setAvailability("BUSY");
        workerRepo.save(nearest);

        // 4. Store on booking document
        booking.setAssignedWorkerId(nearest.getId());
        booking.setAssignedWorkerName(nearest.getName());
        customerServiceRepo.save(booking);

        // 5. Notify worker + customer via SSE (reuse existing SSE service)
        String workerPayload = buildWorkerAssignPayload(booking, nearest);
        String customerPayload = buildCustomerAssignPayload(booking, nearest, minDist);

        sseService.notifyWorker(nearest.getWorkerUserId(), nearest.getId(), workerPayload);
        sseService.notifyCustomer(booking.getUserId(), customerPayload);

        log.info("[Haversine] Nearest worker assigned: " + nearest.getName()
                + " (" + String.format("%.2f", minDist) + " km from customer)");

        return Optional.of(nearest);
    }

    // ── 3. Get worker location for customer ───────────────────────────────────

    /**
     * Returns the current location of the worker assigned to a booking.
     * The customer frontend polls this or listens via SSE.
     */
    public Optional<LocationDTOs.WorkerLocationResponse> getWorkerLocationForBooking(String bookingId) {
        CustomerServiceModel booking = customerServiceRepo.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));

        String workerId = booking.getAssignedWorkerId();
        if (workerId == null) return Optional.empty();

        return locationRepo.findByWorkerId(workerId)
                .map(loc -> new LocationDTOs.WorkerLocationResponse(
                        loc.getWorkerId(),
                        loc.getServiceCenterId(),
                        loc.getLatitude(),
                        loc.getLongitude(),
                        loc.isActive(),
                        loc.getLastUpdatedAt() != null ? loc.getLastUpdatedAt().toString() : ""));
    }

    /**
     * Returns the current raw location for a worker (used by SCO dashboard).
     */
    public Optional<LocationDTOs.WorkerLocationResponse> getWorkerLocation(String workerId) {
        return locationRepo.findByWorkerId(workerId)
                .map(loc -> new LocationDTOs.WorkerLocationResponse(
                        loc.getWorkerId(),
                        loc.getServiceCenterId(),
                        loc.getLatitude(),
                        loc.getLongitude(),
                        loc.isActive(),
                        loc.getLastUpdatedAt() != null ? loc.getLastUpdatedAt().toString() : ""));
    }

    // ── 4. Store customer location ────────────────────────────────────────────

    /**
     * Attaches GPS coordinates to an existing booking.
     * Called when the customer confirms their location on the booking form.
     */
    public CustomerServiceModel storeCustomerLocation(
            String bookingId, Double lat, Double lon) {
        CustomerServiceModel booking = customerServiceRepo.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));
        booking.setCustomerLatitude(lat);
        booking.setCustomerLongitude(lon);
        return customerServiceRepo.save(booking);
    }

    // ── 5. Deactivate worker location ─────────────────────────────────────────

    /**
     * Marks the worker's location as inactive (job completed or worker went off duty).
     * Called from WorkerService when job is completed.
     */
    public void deactivateWorkerLocation(String workerId) {
        locationRepo.findByWorkerId(workerId).ifPresent(loc -> {
            loc.setActive(false);
            locationRepo.save(loc);
        });
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    /**
     * Finds the customer assigned to the worker's current active job and
     * pushes the worker's new GPS position to them via SSE.
     */
    private void broadcastLocationToCustomer(String workerId, Double lat, Double lon) {
        requestRepo.findCurrentJobForWorker(workerId).ifPresent(job -> {
            String customerId = job.getCustomerId();
            if (customerId == null || customerId.isBlank()) return;

            // FIX: use "requestId" (not "jobId") — matches the frontend SSE handler
            // which does: if (data.requestId && ...) setWorkerLocationMap(...)
            String payload = "{"
                    + "\"requestId\":\"" + esc(job.getId()) + "\","
                    + "\"workerId\":\"" + esc(workerId) + "\","
                    + "\"latitude\":" + lat + ","
                    + "\"longitude\":" + lon + ","
                    + "\"timestamp\":\"" + LocalDateTime.now() + "\""
                    + "}";

            sseService.sendWorkerLocationUpdate(customerId, payload);
        });
    }

    private String buildWorkerAssignPayload(CustomerServiceModel booking, SCOWorker worker) {
        return "{"
                + "\"type\":\"WORKER_ASSIGNED\","
                + "\"jobId\":\"" + esc(booking.getId()) + "\","
                + "\"customerId\":\"" + esc(booking.getUserId()) + "\","
                + "\"customerLatitude\":" + booking.getCustomerLatitude() + ","
                + "\"customerLongitude\":" + booking.getCustomerLongitude() + ","
                + "\"address\":\"" + esc(booking.getManualAddress()) + "\","
                + "\"serviceMode\":\"" + esc(booking.getServiceMode()) + "\","
                + "\"vehicleNumber\":\"" + esc(booking.getVehicleNumber()) + "\","
                + "\"brand\":\"" + esc(booking.getBrand()) + "\","
                + "\"vehicleModel\":\"" + esc(booking.getModel()) + "\","
                + "\"status\":\"ASSIGNED\","
                + "\"message\":\"You have been assigned a new Doorstep job!\""
                + "}";
    }

    private String buildCustomerAssignPayload(CustomerServiceModel booking, SCOWorker worker, double distKm) {
        return "{"
                + "\"type\":\"WORKER_ASSIGNED_TO_CUSTOMER\","
                + "\"requestId\":\"" + esc(booking.getId()) + "\","
                + "\"workerName\":\"" + esc(worker.getName()) + "\","
                + "\"workerPhone\":\"" + esc(worker.getPhone()) + "\","
                + "\"workerRole\":\"" + esc(worker.getRole()) + "\","
                + "\"workerRating\":" + (worker.getRating() != null ? worker.getRating() : 0) + ","
                + "\"distanceKm\":" + String.format("%.2f", distKm) + ","
                + "\"status\":\"ASSIGNED\","
                + "\"message\":\"A nearby worker has been assigned to your Doorstep service!\""
                + "}";
    }

    private String esc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}