package com.majorproject.motomate.dto;

import com.majorproject.motomate.enums.ApprovalStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Returned to the frontend after a successful fleet manager registration.
 * Omits sensitive fields (passwordHash, document paths).
 */
@Data
@Builder
public class FleetManagerRegistrationResponse {
    private String id;
    private String managerName;
    private String email;
    private String companyName;
    private String industryType;
    private ApprovalStatus approvalStatus;
    private LocalDateTime submittedAt;
    private String message;
}
