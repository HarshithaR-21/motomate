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
 * Represents a service center owner registration.
 * Stored in the "service_center_registrations" MongoDB collection.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "service_center_registrations")
public class ServiceCenterRegistration {

    @Id
    private String id;

    // ── Step 1: Owner Info ──────────────────────────────────────
    private String ownerName;

    @Indexed(unique = true)
    private String email;

    private String phone;
    private String passwordHash;   // BCrypt-hashed; never store plain text

    // ── Step 2: Center Details ──────────────────────────────────
    private String centerName;
    private String centerType;
    private String address;
    private String city;
    private String state;
    private String pincode;
    private String landmark;
    private String website;
    private String description;

    // ── Step 3: Services & Hours ────────────────────────────────
    private List<String> services;
    private List<String> vehicleTypes;
    private List<String> openDays;
    private String openTime;
    private String closeTime;
    private boolean emergencyService;

    // ── Step 4: Business Documents ─────────────────────────────
    private String gstNumber;
    private String panNumber;
    private String licenseNumber;
    private Integer yearsInBusiness;
    private Integer totalBays;

    // Uploaded file paths (stored on disk / cloud; paths saved here)
    private String gstCertificatePath;
    private String tradeLicensePath;
    private String shopPhotoPath;

    // ── Admin / System Fields ───────────────────────────────────
    @Builder.Default
    private ApprovalStatus approvalStatus = ApprovalStatus.PENDING;

    private String adminRemarks;          // Admin can add notes when approving/rejecting

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
