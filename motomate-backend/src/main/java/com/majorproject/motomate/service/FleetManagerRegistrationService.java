package com.majorproject.motomate.service;

import com.majorproject.motomate.dto.FleetManagerRegistrationRequest;
import com.majorproject.motomate.dto.FleetManagerRegistrationResponse;
import com.majorproject.motomate.enums.ApprovalStatus;
import com.majorproject.motomate.model.FleetManagerRegistration;
import com.majorproject.motomate.notification.EmailNotificationService;
import com.majorproject.motomate.repository.FleetManagerRegistrationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class FleetManagerRegistrationService {

    private final FleetManagerRegistrationRepository repository;
    private final PasswordEncoder passwordEncoder;                 // reused from SecurityConfig
    private final EmailNotificationService emailNotificationService; // reused existing bean
    private final FileUploadService fileUploadService;             // reused existing bean

    // ─────────────────────────────────────────────────────────────────────────
    //  Register a new fleet manager
    // ─────────────────────────────────────────────────────────────────────────

    public FleetManagerRegistrationResponse register(
            FleetManagerRegistrationRequest request,
            MultipartFile gstCertificate,
            MultipartFile companyPanCard,
            MultipartFile vehicleRcBook,
            MultipartFile authorizationLetter
    ) throws IOException {

        // 1. Password match check
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match.");
        }

        // 2. Duplicate email check
        if (repository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException(
                "An account with email '" + request.getEmail() + "' already exists."
            );
        }

        // 3. Build and save the registration document
        FleetManagerRegistration registration = FleetManagerRegistration.builder()
                // Step 1
                .managerName(request.getManagerName())
                .designation(request.getDesignation())
                .email(request.getEmail().toLowerCase().trim())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                // Step 2
                .companyName(request.getCompanyName())
                .industryType(request.getIndustryType())
                .companyAddress(request.getCompanyAddress())
                .city(request.getCity())
                .state(request.getState())
                .pincode(request.getPincode())
                .companyWebsite(request.getCompanyWebsite())
                .companyDescription(request.getCompanyDescription())
                // Step 3
                .totalVehicles(request.getTotalVehicles())
                .vehicleCategories(request.getVehicleCategories())
                .serviceNeeds(request.getServiceNeeds())
                .primaryGarage(request.getPrimaryGarage())
                .preferredServiceTime(request.getPreferredServiceTime())
                .hasDedicatedMechanic(request.isHasDedicatedMechanic())
                // Step 4
                .gstNumber(request.getGstNumber().toUpperCase().trim())
                .panNumber(request.getPanNumber().toUpperCase().trim())
                .cinNumber(request.getCinNumber())
                .contactPersonAlt(request.getContactPersonAlt())
                .altPhone(request.getAltPhone())
                // Default status
                .approvalStatus(ApprovalStatus.PENDING)
                .build();

        registration = repository.save(registration);
        log.info("Saved fleet manager registration id={} for email={}", registration.getId(), registration.getEmail());

        // 4. Save uploaded files and update paths
        String regId = registration.getId();
        boolean filesUpdated = false;

        if (gstCertificate != null && !gstCertificate.isEmpty()) {
            registration.setGstCertificatePath(
                fileUploadService.save(gstCertificate, regId, "gst-certificate")
            );
            filesUpdated = true;
        }
        if (companyPanCard != null && !companyPanCard.isEmpty()) {
            registration.setCompanyPanCardPath(
                fileUploadService.save(companyPanCard, regId, "company-pan-card")
            );
            filesUpdated = true;
        }
        if (vehicleRcBook != null && !vehicleRcBook.isEmpty()) {
            registration.setVehicleRcBookPath(
                fileUploadService.save(vehicleRcBook, regId, "vehicle-rc-book")
            );
            filesUpdated = true;
        }
        if (authorizationLetter != null && !authorizationLetter.isEmpty()) {
            registration.setAuthorizationLetterPath(
                fileUploadService.save(authorizationLetter, regId, "authorization-letter")
            );
            filesUpdated = true;
        }

        if (filesUpdated) {
            registration = repository.save(registration);
        }

        // 5. Fire async emails — reuses EmailNotificationService methods you added
        emailNotificationService.sendAdminFleetManagerAlert(registration);
        emailNotificationService.sendFleetManagerConfirmation(registration);

        log.info("Fleet registration complete for company='{}', status=PENDING", registration.getCompanyName());

        return toResponse(registration);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Read helpers (ready for Admin dashboard)
    // ─────────────────────────────────────────────────────────────────────────

    public List<FleetManagerRegistration> getAllPending() {
        return repository.findByApprovalStatus(ApprovalStatus.PENDING);
    }

    public List<FleetManagerRegistration> getAll() {
        return repository.findAll();
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Mapper
    // ─────────────────────────────────────────────────────────────────────────

    private FleetManagerRegistrationResponse toResponse(FleetManagerRegistration reg) {
        return FleetManagerRegistrationResponse.builder()
                .id(reg.getId())
                .managerName(reg.getManagerName())
                .email(reg.getEmail())
                .companyName(reg.getCompanyName())
                .industryType(reg.getIndustryType())
                .approvalStatus(reg.getApprovalStatus())
                .submittedAt(reg.getCreatedAt())
                .message("Your fleet account application has been submitted successfully. "
                       + "You will be notified at " + reg.getEmail()
                       + " within 1–2 business days.")
                .build();
    }
}
