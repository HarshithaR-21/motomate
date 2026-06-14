package com.majorproject.motomate.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

/**
 * Stores emergency contacts for a customer.
 * One document per customer (upserted).
 * Collection: customer_emergency_contacts
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "customer_emergency_contacts")
public class CustomerEmergencyContacts {

    @Id
    private String id;

    @Indexed(unique = true)
    private String customerId;

    @Builder.Default
    private List<EmergencyContact> contacts = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmergencyContact {
        private String name;
        private String phone;
        private String relation;
    }
}
