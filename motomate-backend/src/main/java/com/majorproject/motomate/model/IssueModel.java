package com.majorproject.motomate.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "issues")
public class IssueModel {

    @Id
    private String id;

    private String ticketId;        // e.g. TKT-0001 (auto-generated)
    private String subject;
    private String message;
    private String category;        // Service, Billing, Technical, Account, Other

    // Who raised the issue
    private String userId;
    private String userName;
    private String userEmail;
    private String userPhone;

    @Builder.Default
    private String status = "OPEN"; // OPEN, IN_PROGRESS, RESOLVED

    // Admin replies
    @Builder.Default
    private List<IssueReply> replies = new ArrayList<>();

    private String resolvedBy;      // Admin ID who resolved

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    // ── Nested reply ──────────────────────────────────────────────
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IssueReply {
        private String sender;       // "admin" or "user"
        private String senderName;
        private String message;
        private LocalDateTime createdAt;
    }
}
