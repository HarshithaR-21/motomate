package com.majorproject.motomate.dto;

/**
 * DTOs for the Maps / Location feature.
 */
public class LocationDTOs {

    // ── Worker sends this to update their live location ───────────────────────

    public static class WorkerLocationUpdateRequest {
        private Double latitude;
        private Double longitude;

        public Double getLatitude()  { return latitude; }
        public void setLatitude(Double latitude) { this.latitude = latitude; }

        public Double getLongitude()  { return longitude; }
        public void setLongitude(Double longitude) { this.longitude = longitude; }
    }

    // ── Response returned after a worker location update ──────────────────────

    public static class WorkerLocationResponse {
        private String workerId;
        private String serviceCenterId;
        private Double latitude;
        private Double longitude;
        private boolean active;
        private String lastUpdatedAt;

        public WorkerLocationResponse() {}

        public WorkerLocationResponse(String workerId, String serviceCenterId,
                Double latitude, Double longitude, boolean active, String lastUpdatedAt) {
            this.workerId = workerId;
            this.serviceCenterId = serviceCenterId;
            this.latitude = latitude;
            this.longitude = longitude;
            this.active = active;
            this.lastUpdatedAt = lastUpdatedAt;
        }

        public String getWorkerId()        { return workerId; }
        public String getServiceCenterId() { return serviceCenterId; }
        public Double getLatitude()        { return latitude; }
        public Double getLongitude()       { return longitude; }
        public boolean isActive()          { return active; }
        public String getLastUpdatedAt()   { return lastUpdatedAt; }
    }

    // ── Payload the customer sends to store their GPS coordinates ─────────────

    public static class CustomerLocationRequest {
        private Double latitude;
        private Double longitude;

        public Double getLatitude()  { return latitude; }
        public void setLatitude(Double latitude) { this.latitude = latitude; }

        public Double getLongitude()  { return longitude; }
        public void setLongitude(Double longitude) { this.longitude = longitude; }
    }

    // ── SSE payload broadcast to customer when worker location changes ────────

    public static class WorkerLocationBroadcast {
        private String type = "WORKER_LOCATION_UPDATE";
        private String workerId;
        private Double latitude;
        private Double longitude;
        private String timestamp;

        public WorkerLocationBroadcast() {}

        public WorkerLocationBroadcast(String workerId, Double latitude, Double longitude, String timestamp) {
            this.workerId = workerId;
            this.latitude = latitude;
            this.longitude = longitude;
            this.timestamp = timestamp;
        }

        public String getType()      { return type; }
        public String getWorkerId()  { return workerId; }
        public Double getLatitude()  { return latitude; }
        public Double getLongitude() { return longitude; }
        public String getTimestamp() { return timestamp; }
    }
}
