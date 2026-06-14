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

import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.util.List;

/**
 * EV Vehicle entity.
 * Stores EV-specific attributes for a customer's electric vehicle.
 * Collection: ev_vehicles
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "ev_vehicles")
public class EVVehicle {

    @Id
    private String id;

    @Indexed
    private String ownerId;          // References UserModel.id

    private String vehicleNumber;
    private String manufacturer;     // e.g. Tata, Ather, Ola, Mahindra
    private String model;            // e.g. Nexon EV, 450X
    private String color;
    private Integer yearOfManufacture;

    @Positive(message = "Battery capacity must be greater than 0")
    private Double batteryCapacityKwh;

    @DecimalMin(value = "0.0", message = "Battery percentage cannot be negative")
    @DecimalMax(value = "100.0", message = "Battery percentage cannot exceed 100")
    @Builder.Default
    private Double currentBatteryPercentage = null; // Not collected at registration — varies over time

    private String chargingPortType;  // CCS | CCS2 | CHAdeMO | Type2 | GBT

    @Positive(message = "Vehicle range must be greater than 0")
    private Double vehicleRangeKm;

    @Builder.Default
    private boolean fastChargingSupported = false;

    private String vehicleImagePath;

    @Builder.Default
    private boolean active = true;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    // Supported charging port types
    public enum ChargingPortType {
        CCS, CCS2, CHAdeMO, Type2, GBT
    }
}
