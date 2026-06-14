package com.majorproject.motomate.util;

/**
 * Haversine formula for accurate GPS distance calculation.
 * Returns distance in kilometres between two lat/lng points.
 */
public final class GpsDistanceUtil {

    private GpsDistanceUtil() {}

    private static final double EARTH_RADIUS_KM = 6371.0;

    /**
     * Calculate the great-circle distance between two GPS coordinates.
     *
     * @param lat1 Latitude of point A (degrees)
     * @param lng1 Longitude of point A (degrees)
     * @param lat2 Latitude of point B (degrees)
     * @param lng2 Longitude of point B (degrees)
     * @return Distance in kilometres
     */
    public static double distanceKm(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_KM * c;
    }

    /**
     * Estimate travel time assuming average speed of 30 km/h in city traffic.
     *
     * @param distanceKm distance in km
     * @return estimated minutes
     */
    public static int estimatedMinutes(double distanceKm) {
        return (int) Math.ceil((distanceKm / 30.0) * 60);
    }
}