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
    @Pattern(regexp = "^\\d{10}$", message = "Phone must be exactly 10 digits")
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

    private String centerType;

    @NotBlank(message = "Address is required")
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

    // ── Step 3: Services & Hours ────────────────────────────────

    @NotEmpty(message = "Select at least one service")
    private List<String> services;

    @NotEmpty(message = "Select at least one vehicle type")
    private List<String> vehicleTypes;

    @NotEmpty(message = "Select at least one working day")
    private List<String> openDays;

    @NotBlank(message = "Opening time is required")
    private String openTime;

    @NotBlank(message = "Closing time is required")
    private String closeTime;

    private boolean emergencyService;

    // ── Step 4: Business Documents ─────────────────────────────

    @NotBlank(message = "GST number is required")
    private String gstNumber;

    @NotBlank(message = "PAN number is required")
    @Pattern(regexp = "^[A-Z]{5}[0-9]{4}[A-Z]$", message = "Invalid PAN format (e.g. ABCDE1234F)")
    private String panNumber;

    @NotBlank(message = "License number is required")
    private String licenseNumber;

    private Integer yearsInBusiness;
    private Integer totalBays;
}
