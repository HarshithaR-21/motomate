package com.majorproject.motomate.controller;

import com.majorproject.motomate.dto.ApiResponse;
import com.majorproject.motomate.dto.ServiceCenterRegistrationRequest;
import com.majorproject.motomate.dto.ServiceCenterRegistrationResponse;
import com.majorproject.motomate.service.ServiceCenterRegistrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * REST Controller for Service Center Owner Sign-Up.
 *
 * Base URL: /api/v1/service-centers
 *
 * Endpoints:
 *  POST /register     – Submit registration form + optional documents
 *  GET  /check-email  – Check if email is already taken (used for real-time validation)
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/service-centers")
@CrossOrigin(origins = "*")   // Tighten this to your frontend URL in production
@RequiredArgsConstructor
public class ServiceCenterRegistrationController {

    private final ServiceCenterRegistrationService registrationService;

    // ─────────────────────────────────────────────────────────────────────────
    //  POST /api/v1/service-centers/register
    //
    //  Accepts multipart/form-data so JSON form fields and file uploads are
    //  sent in a single request.
    //
    //  Form fields  → "data"    (JSON string of ServiceCenterRegistrationRequest)
    //  File fields  → "gstCertificate", "tradeLicense", "shopPhoto"
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping(
        value = "/register",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<ApiResponse<ServiceCenterRegistrationResponse>> register(
            @RequestPart("data") @Valid ServiceCenterRegistrationRequest request,
            @RequestPart(value = "gstCertificate", required = false) MultipartFile gstCertificate,
            @RequestPart(value = "tradeLicense",    required = false) MultipartFile tradeLicense,
            @RequestPart(value = "shopPhoto",       required = false) MultipartFile shopPhoto
    ) {
        log.info("Registration request received for email={}", request.getEmail());

        try {
            ServiceCenterRegistrationResponse response =
                registrationService.register(request, gstCertificate, tradeLicense, shopPhoto);

            return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                    "Application submitted successfully. You'll be notified within 2–3 business days.",
                    response
                ));

        } catch (IllegalArgumentException e) {
            log.warn("Registration rejected: {}", e.getMessage());
            return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiResponse.failure(e.getMessage()));

        } catch (Exception e) {
            log.error("Unexpected error during registration", e);
            return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.failure("Something went wrong. Please try again."));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  GET /api/v1/service-centers/check-email?email=owner@example.com
    //
    //  Returns { available: true/false } — useful for inline email validation
    //  in the frontend before the user submits the full form.
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/check-email")
    public ResponseEntity<ApiResponse<Boolean>> checkEmailAvailability(
            @RequestParam String email
    ) {
        boolean exists = registrationService.getAll()
            .stream()
            .anyMatch(r -> r.getEmail().equalsIgnoreCase(email));

        if (exists) {
            return ResponseEntity.ok(
                ApiResponse.<Boolean>builder()
                    .success(true)
                    .message("Email is already registered.")
                    .data(false)   // data = false → NOT available
                    .build()
            );
        }

        return ResponseEntity.ok(
            ApiResponse.<Boolean>builder()
                .success(true)
                .message("Email is available.")
                .data(true)
                .build()
        );
    }
}
