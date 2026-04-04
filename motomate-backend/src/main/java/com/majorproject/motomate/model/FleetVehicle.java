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

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "fleet_vehicles")
public class FleetVehicle {

    @Id
    private String id;

    @Indexed(unique = true)
    private String vehicleNumber;

    private String vehicleType; // CAR, BIKE, TRUCK

    private String brand;
    private String model;
    private String fuelType;
    private String year;

    private String issueDescription;
    private String fleetTag;         // optional grouping label

    private String fleetManagerId;   // owner reference

    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, INACTIVE, IN_SERVICE

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
