package com.majorproject.motomate.util;

/**
 * Utility class for Haversine distance calculation.
 *
 * Formula:
 *   distance = 2 × R × asin( √( sin²((lat2−lat1)/2) + cos(lat1)×cos(lat2)×sin²((lon2−lon1)/2) ) )
 *
 * Where R = 6371 km (mean Earth radius).
 *
 * All inputs are in decimal degrees. Output is in kilometres.
 */
public final class HaversineUtil {

    private static final double EARTH_RADIUS_KM = 6371.0;

    // Utility class — no instantiation
    private HaversineUtil() {}

    /**
     * Calculates the great-circle distance between two geographic points.
     *
     * @param lat1 latitude of point 1  (decimal degrees)
     * @param lon1 longitude of point 1 (decimal degrees)
     * @param lat2 latitude of point 2  (decimal degrees)
     * @param lon2 longitude of point 2 (decimal degrees)
     * @return distance in kilometres
     */
    public static double calculate(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double radLat1 = Math.toRadians(lat1);
        double radLat2 = Math.toRadians(lat2);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                 + Math.cos(radLat1) * Math.cos(radLat2)
                 * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.asin(Math.sqrt(a));

        return EARTH_RADIUS_KM * c;
    }
}
