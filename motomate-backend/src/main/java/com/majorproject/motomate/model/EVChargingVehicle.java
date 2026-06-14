package com.majorproject.motomate.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Mobile EV Charging Vehicle.
 * Represents a van/truck that provides mobile charging.
 * Collection: ev_charging_vehicles
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "ev_charging_vehicles")
public class EVChargingVehicle {

    @Id
    private String id;

    private String vehicleNumber;
    private String driverName;
    private String driverPhone;

    private Double latitude;
    private Double longitude;

    private Double availableEnergyKwh;   // current available charge capacity
    private Double totalCapacityKwh;

    private List<String> connectorTypes; // CCS | CCS2 | CHAdeMO | Type2 | GBT

    @Builder.Default
    private String status = "AVAILABLE"; // AVAILABLE | ON_ROUTE | CHARGING | OFFLINE

    private String workshopId;           // home base workshop

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}