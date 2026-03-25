package com.majorproject.motomate.model;

import com.majorproject.motomate.enums.ApprovalStatus;
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
 * Represents a Fleet Manager registration.
 * Stored in the "fleet_manager_registrations" MongoDB collection.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "fleet_manager_registrations")
public class FleetManagerRegistration {

    @Id
    private String id;

    // ── Step 1: Manager Info ────────────────────────────────────
    private String managerName;
    private String designation;

    @Indexed(unique = true)
    private String email;

    private String phone;
    private String passwordHash;

    // ── Step 2: Company Details ─────────────────────────────────
    private String companyName;
    private String industryType;
    private String companyAddress;
    private String city;
    private String state;
    private String pincode;
    private String companyWebsite;
    private String companyDescription;

    // ── Step 3: Fleet Info ──────────────────────────────────────
    private Integer totalVehicles;
    private List<String> vehicleCategories;
    private List<String> serviceNeeds;
    private String primaryGarage;
    private String preferredServiceTime;
    private boolean hasDedicatedMechanic;

    // ── Step 4: Documents ───────────────────────────────────────
    private String gstNumber;
    private String panNumber;
    private String cinNumber;
    private String contactPersonAlt;
    private String altPhone;

    // Uploaded file paths
    private String gstCertificatePath;
    private String companyPanCardPath;
    private String vehicleRcBookPath;
    private String authorizationLetterPath;

    // ── System Fields ───────────────────────────────────────────
    @Builder.Default
    private ApprovalStatus approvalStatus = ApprovalStatus.PENDING;

    private String adminRemarks;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
