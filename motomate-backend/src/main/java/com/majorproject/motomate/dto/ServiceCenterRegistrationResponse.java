package com.majorproject.motomate.dto;

import com.majorproject.motomate.enums.ApprovalStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Returned to the frontend after a successful registration submission.
 * Intentionally omits sensitive fields (passwordHash, document paths).
 */
@Data
@Builder
public class ServiceCenterRegistrationResponse {
    private String id;
    private String ownerName;
    private String email;
    private String centerName;
    private ApprovalStatus approvalStatus;
    private LocalDateTime submittedAt;
    private String message;
}
