package com.majorproject.motomate.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;

/**
 * DTO that maps 1-to-1 with the FleetManagerSignup React form.
 */
@Data
public class FleetManagerRegistrationRequest {

    // ── Step 1: Manager Info ────────────────────────────────────

    @NotBlank(message = "Manager name is required")
    private String managerName;

    private String designation;

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

    // ── Step 2: Company Details ─────────────────────────────────

    @NotBlank(message = "Company name is required")
    private String companyName;

    @NotBlank(message = "Industry type is required")
    private String industryType;

    @NotBlank(message = "Company address is required")
    private String companyAddress;

    @NotBlank(message = "City is required")
    private String city;

    @NotBlank(message = "State is required")
    private String state;

    @NotBlank(message = "Pincode is required")
    @Pattern(regexp = "^\\d{6}$", message = "Pincode must be 6 digits")
    private String pincode;

    private String companyWebsite;
    private String companyDescription;

    // ── Step 3: Fleet Info ──────────────────────────────────────

    @NotNull(message = "Total vehicles count is required")
    @Min(value = 1, message = "Fleet must have at least 1 vehicle")
    private Integer totalVehicles;

    @NotEmpty(message = "Select at least one vehicle category")
    private List<String> vehicleCategories;

    @NotEmpty(message = "Select at least one service need")
    private List<String> serviceNeeds;

    private String primaryGarage;
    private String preferredServiceTime;
    private boolean hasDedicatedMechanic;

    // ── Step 4: Documents ───────────────────────────────────────

    @NotBlank(message = "GST number is required")
    private String gstNumber;

    @NotBlank(message = "PAN number is required")
    @Pattern(regexp = "^[A-Z]{5}[0-9]{4}[A-Z]$", message = "Invalid PAN format (e.g. ABCDE1234F)")
    private String panNumber;

    private String cinNumber;
    private String contactPersonAlt;
    private String altPhone;
}
