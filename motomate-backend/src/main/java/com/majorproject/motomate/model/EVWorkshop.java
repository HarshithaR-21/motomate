package com.majorproject.motomate.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

/**
 * EV Workshop entity.
 * Represents a workshop that handles EV servicing.
 * Collection: ev_workshops
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "ev_workshops")
public class EVWorkshop {

    @Id
    private String id;

    /** References UserModel.id of the SERVICE_CENTER_OWNER who manages this EV workshop (for login/dashboard resolution). */
    private String ownerId;

    private String workshopName;
    private String ownerName;
    private String phoneNumber;
    private String email;
    private String address;
    private String city;
    private String state;

    private Double latitude;
    private Double longitude;

    private String description;
    private String certificationLevel;   // BASIC | ADVANCED | CERTIFIED_EXPERT

    private String operatingHours;       // e.g. "9:00 AM - 7:00 PM"
    private List<String> openDays;       // e.g. ["MON","TUE","WED","THU","FRI","SAT"]

    private List<String> supportedBrands;        // e.g. ["Tata","Ather","Mahindra","Ola"]
    private List<String> supportedChargingPorts; // CCS | CCS2 | CHAdeMO | Type2 | GBT

    private Double rating;
    private Integer totalReviews;
    private Integer availableWorkers;
    private Double distanceKm;

    @Builder.Default
    private String status = "ACTIVE";    // ACTIVE | INACTIVE

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}