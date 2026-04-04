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

/**
 * A service offered by a Service Center (e.g., Oil Change, Tyre Rotation).
 * Collection: sco_services
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "sco_services")
public class SCOService {

    @Id
    private String id;

    private String serviceCenterId;   // owner's userId (from UserModel)
    private String name;              // e.g. "Oil Change"
    private String description;
    private Double price;             // INR
    private Integer durationMinutes;  // e.g. 60
    private String category;
    
    @Builder.Default// e.g. "Engine", "Tyres", "Body"
    private boolean active = true;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}