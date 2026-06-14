package com.majorproject.motomate.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;

/**
 * DTO that maps 1-to-1 with the ServiceCenterSignup React form.
 * All four steps are combined into a single payload submitted on final "Submit Application".
 */
@Data
public class ServiceCenterRegistrationRequest {

    // ── Step 1: Owner Info ──────────────────────────────────────

    @NotBlank(message = "Owner name is required")
    private String ownerName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email address")
    private String email;

    @NotBlank(message = "Phone is required")
    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Enter a valid 10-digit Indian mobile number")
    private String phone;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$",
        message = "Password must include uppercase, lowercase, number, and special character"
    )
    private String password;

    @NotBlank(message = "Confirm password is required")
    private String confirmPassword;

    // ── Step 2: Center Details ──────────────────────────────────

    @NotBlank(message = "Center name is required")
    private String centerName;

    @NotBlank(message = "Center type is required")
    private String centerType;

    /**
     * Full street address — mandatory.
     * The frontend validates this via Nominatim autocomplete before submission.
     * Backend also enforces non-blank to prevent bypassing front-end validation.
     */
    @NotBlank(message = "Address is required — customers use this to locate you")
    @Size(min = 10, message = "Please enter a complete address (at least 10 characters)")
    private String address;

    @NotBlank(message = "City is required")
    private String city;

    @NotBlank(message = "State is required")
    private String state;

    @NotBlank(message = "Pincode is required")
    @Pattern(regexp = "^\\d{6}$", message = "Pincode must be 6 digits")
    private String pincode;

    private String landmark;
    private String website;
    private String description;

    /**
     * Latitude geocoded from the address by the frontend (via Nominatim).
     * Stored so service centers can be shown on maps.
     */
    private Double latitude;

    /**
     * Longitude geocoded from the address by the frontend (via Nominatim).
     */
    private Double longitude;

    // ── Step 3: Services, Vehicle Types & Hours ─────────────────

    @NotEmpty(message = "Select at least one service you offer")
    private List<String> services;

    @NotEmpty(message = "Select at least one vehicle type")
    private List<String> vehicleTypes;

    /**
     * Specific car/bike brands this center can service.
     * Used by customers to filter service centers by their vehicle brand.
     */
    private List<String> supportedBrands;

    @NotEmpty(message = "Select at least one working day")
    private List<String> openDays;

    @NotBlank(message = "Opening time is required")
    private String openTime;

    @NotBlank(message = "Closing time is required")
    private String closeTime;

    private boolean emergencyService;

    // ── Step 4: Business Documents ─────────────────────────────

    @NotBlank(message = "GST number is required")
    @Pattern(
        regexp = "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$",
        message = "Invalid GST format (e.g. 29ABCDE1234F1Z5)"
    )
    private String gstNumber;

    @NotBlank(message = "PAN number is required")
    @Pattern(regexp = "^[A-Z]{5}[0-9]{4}[A-Z]$", message = "Invalid PAN format (e.g. ABCDE1234F)")
    private String panNumber;

    @NotBlank(message = "Trade / shop license number is required")
    private String licenseNumber;

    private Integer yearsInBusiness;
    private Integer totalBays;
}
