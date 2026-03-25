package com.majorproject.motomate.service;

import com.majorproject.motomate.dto.ServiceCenterRegistrationRequest;
import com.majorproject.motomate.dto.ServiceCenterRegistrationResponse;
import com.majorproject.motomate.enums.ApprovalStatus;
import com.majorproject.motomate.model.ServiceCenterRegistration;
import com.majorproject.motomate.notification.EmailNotificationService;
import com.majorproject.motomate.repository.ServiceCenterRegistrationRepository;
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
public class ServiceCenterRegistrationService {

    private final ServiceCenterRegistrationRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final EmailNotificationService emailNotificationService;
    private final FileUploadService fileUploadService;

    // ─────────────────────────────────────────────────────────────────────────
    //  Register a new service center
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Registers a new service center owner.
     * Steps:
     *  1. Validate passwords match
     *  2. Check email is not already registered
     *  3. Hash the password
     *  4. Save the document
     *  5. Save uploaded documents (if any)
     *  6. Fire async emails (admin alert + owner confirmation)
     */
    public ServiceCenterRegistrationResponse register(
            ServiceCenterRegistrationRequest request,
            MultipartFile gstCertificate,
            MultipartFile tradeLicense,
            MultipartFile shopPhoto
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

        // 3. Build and save the registration document (without file paths first, to get the ID)
        ServiceCenterRegistration registration = ServiceCenterRegistration.builder()
                // Step 1
                .ownerName(request.getOwnerName())
                .email(request.getEmail().toLowerCase().trim())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                // Step 2
                .centerName(request.getCenterName())
                .centerType(request.getCenterType())
                .address(request.getAddress())
                .city(request.getCity())
                .state(request.getState())
                .pincode(request.getPincode())
                .landmark(request.getLandmark())
                .website(request.getWebsite())
                .description(request.getDescription())
                // Step 3
                .services(request.getServices())
                .vehicleTypes(request.getVehicleTypes())
                .openDays(request.getOpenDays())
                .openTime(request.getOpenTime())
                .closeTime(request.getCloseTime())
                .emergencyService(request.isEmergencyService())
                // Step 4
                .gstNumber(request.getGstNumber().toUpperCase().trim())
                .panNumber(request.getPanNumber().toUpperCase().trim())
                .licenseNumber(request.getLicenseNumber().trim())
                .yearsInBusiness(request.getYearsInBusiness())
                .totalBays(request.getTotalBays())
                // Default status
                .approvalStatus(ApprovalStatus.PENDING)
                .build();

        registration = repository.save(registration);
        log.info("Saved registration id={} for email={}", registration.getId(), registration.getEmail());

        // 4. Save uploaded files and update paths
        String regId = registration.getId();
        boolean filesUpdated = false;

        if (gstCertificate != null && !gstCertificate.isEmpty()) {
            registration.setGstCertificatePath(
                fileUploadService.save(gstCertificate, regId, "gst-certificate")
            );
            filesUpdated = true;
        }
        if (tradeLicense != null && !tradeLicense.isEmpty()) {
            registration.setTradeLicensePath(
                fileUploadService.save(tradeLicense, regId, "trade-license")
            );
            filesUpdated = true;
        }
        if (shopPhoto != null && !shopPhoto.isEmpty()) {
            registration.setShopPhotoPath(
                fileUploadService.save(shopPhoto, regId, "shop-photo")
            );
            filesUpdated = true;
        }

        if (filesUpdated) {
            registration = repository.save(registration);
        }

        // 5. Fire async email notifications (non-blocking)
        emailNotificationService.sendAdminNewApplicationAlert(registration);
        emailNotificationService.sendOwnerApplicationConfirmation(registration);

        log.info("Registration complete for center='{}', status=PENDING", registration.getCenterName());

        return toResponse(registration);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Read – useful for Admin dashboard (stubs for now)
    // ─────────────────────────────────────────────────────────────────────────

    public List<ServiceCenterRegistration> getAllPending() {
        return repository.findByApprovalStatus(ApprovalStatus.PENDING);
    }

    public List<ServiceCenterRegistration> getAll() {
        return repository.findAll();
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Mapper
    // ─────────────────────────────────────────────────────────────────────────

    private ServiceCenterRegistrationResponse toResponse(ServiceCenterRegistration reg) {
        return ServiceCenterRegistrationResponse.builder()
                .id(reg.getId())
                .ownerName(reg.getOwnerName())
                .email(reg.getEmail())
                .centerName(reg.getCenterName())
                .approvalStatus(reg.getApprovalStatus())
                .submittedAt(reg.getCreatedAt())
                .message("Your application has been submitted successfully. "
                       + "You will be notified at " + reg.getEmail()
                       + " within 2–3 business days.")
                .build();
    }
}
