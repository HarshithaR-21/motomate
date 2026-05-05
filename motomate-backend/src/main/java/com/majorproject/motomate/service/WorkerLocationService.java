package com.majorproject.motomate.service;

import com.majorproject.motomate.model.WorkerLocation;
import com.majorproject.motomate.model.SCOWorker;
import com.majorproject.motomate.repository.WorkerLocationRepository;
import com.majorproject.motomate.repository.SCOWorkerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkerLocationService {

    private final WorkerLocationRepository workerLocationRepository;
    private final SCOWorkerRepository      scoWorkerRepository;

    // ── Existing: push GPS from worker app ───────────────────────────────────

    public void updateWorkerLocation(String workerId, double latitude, double longitude) {
        WorkerLocation loc = workerLocationRepository.findByWorkerId(workerId)
                .orElse(WorkerLocation.builder().workerId(workerId).build());
        loc.setLatitude(latitude);
        loc.setLongitude(longitude);
        // FIX: field is lastUpdatedAt (LocalDateTime), not updatedAt (Instant)
        // @LastModifiedDate on WorkerLocation handles this automatically when
        // Spring Data Auditing is enabled — set explicitly here as a fallback.
        loc.setLastUpdatedAt(LocalDateTime.now());
        workerLocationRepository.save(loc);
    }

    // ── NEW: active workers for NearbyWorkersMap ─────────────────────────────

    /**
     * Returns all AVAILABLE workers who sent a GPS ping in the last 5 minutes,
     * optionally filtered to a specific service center.
     */
    public List<Map<String, Object>> getActiveWorkers(String serviceCenterId) {
        // FIX: cutoff is LocalDateTime, matching WorkerLocation.lastUpdatedAt
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(5);

        List<WorkerLocation> recent =
                workerLocationRepository.findByLastUpdatedAtAfter(cutoff);

        return recent.stream()
                .map(loc -> buildWorkerEntry(loc, serviceCenterId))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    private Map<String, Object> buildWorkerEntry(WorkerLocation loc, String serviceCenterId) {
        Optional<SCOWorker> opt = scoWorkerRepository.findById(loc.getWorkerId());
        if (opt.isEmpty()) return null;

        SCOWorker w = opt.get();

        if (!"AVAILABLE".equalsIgnoreCase(w.getAvailability())) return null;

        if (serviceCenterId != null && !serviceCenterId.isBlank()) {
            if (!serviceCenterId.equals(w.getServiceCenterId())) return null;
        }

        Map<String, Object> entry = new LinkedHashMap<>();
        entry.put("id",           loc.getId());
        entry.put("workerId",     w.getId());
        entry.put("workerUserId", w.getWorkerUserId());
        entry.put("workerName",   w.getName());
        entry.put("role",         w.getRole());
        entry.put("rating",       w.getRating() != null ? w.getRating() : 0.0);
        entry.put("phone",        w.getPhone());
        entry.put("skills",       w.getSkills() != null ? w.getSkills() : List.of());
        entry.put("availability", w.getAvailability());
        entry.put("latitude",     loc.getLatitude());
        entry.put("longitude",    loc.getLongitude());
        return entry;
    }
}