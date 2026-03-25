package com.majorproject.motomate.controller;

import com.majorproject.motomate.dto.ApiResponse;
import com.majorproject.motomate.dto.FleetManagerRegistrationRequest;
import com.majorproject.motomate.dto.FleetManagerRegistrationResponse;
import com.majorproject.motomate.service.FleetManagerRegistrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * REST Controller for Fleet Manager Sign-Up.
 *
 * Base URL: /api/v1/fleet-managers
 *
 * Endpoints:
 *  POST /register     – Submit registration form + optional documents
 *  GET  /check-email  – Check if email is already taken
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/fleet-managers")
@CrossOrigin(origins = "*")   // Tighten to your frontend URL in production
@RequiredArgsConstructor
public class FleetManagerRegistrationController {

    private final FleetManagerRegistrationService registrationService;

    // ─────────────────────────────────────────────────────────────────────────
    //  POST /api/v1/fleet-managers/register
    //
    //  Accepts multipart/form-data:
    //  Form fields  → "data"                 (JSON blob of FleetManagerRegistrationRequest)
    //  File fields  → "gstCertificate", "companyPanCard", "vehicleRcBook", "authorizationLetter"
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping(
        value = "/register",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<ApiResponse<FleetManagerRegistrationResponse>> register(
            @RequestPart("data") @Valid FleetManagerRegistrationRequest request,
            @RequestPart(value = "gstCertificate",      required = false) MultipartFile gstCertificate,
            @RequestPart(value = "companyPanCard",       required = false) MultipartFile companyPanCard,
            @RequestPart(value = "vehicleRcBook",        required = false) MultipartFile vehicleRcBook,
            @RequestPart(value = "authorizationLetter",  required = false) MultipartFile authorizationLetter
    ) {
        log.info("Fleet manager registration request received for email={}", request.getEmail());

        try {
            FleetManagerRegistrationResponse response = registrationService.register(
                request, gstCertificate, companyPanCard, vehicleRcBook, authorizationLetter
            );

            return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                    "Fleet account application submitted. You'll be notified within 1–2 business days.",
                    response
                ));

        } catch (IllegalArgumentException e) {
            log.warn("Fleet registration rejected: {}", e.getMessage());
            return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiResponse.failure(e.getMessage()));

        } catch (Exception e) {
            log.error("Unexpected error during fleet manager registration", e);
            return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.failure("Something went wrong. Please try again."));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  GET /api/v1/fleet-managers/check-email?email=manager@example.com
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/check-email")
    public ResponseEntity<ApiResponse<Boolean>> checkEmailAvailability(
            @RequestParam String email
    ) {
        boolean exists = registrationService.getAll()
            .stream()
            .anyMatch(r -> r.getEmail().equalsIgnoreCase(email));

        return ResponseEntity.ok(
            ApiResponse.<Boolean>builder()
                .success(true)
                .message(exists ? "Email is already registered." : "Email is available.")
                .data(!exists)
                .build()
        );
    }
}
