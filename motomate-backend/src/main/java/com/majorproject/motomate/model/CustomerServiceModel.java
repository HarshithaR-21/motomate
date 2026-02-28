package com.majorproject.motomate.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Document(collection = "customer_services")
public class CustomerServiceModel {
    
    @Id
    private String id;
    
    // Vehicle Information
    private String vehicleType;
    private String selectedVehicle;
    private String brand;
    private String model;
    private String fuelType;
    private String vehicleNumber;
    
    // Service Details - Store service IDs that reference ServiceDetails collection
    private List<String> selectedServiceIds;  // IDs from ServiceDetails
    private Double totalEstimatedPrice;
    private Integer totalEstimatedDuration;
    
    private String serviceLocation;
    private String manualAddress;
    private String serviceMode;
    
    // Scheduling
    private LocalDate selectedDate;

    @com.fasterxml.jackson.databind.annotation.JsonDeserialize(
            using = com.majorproject.motomate.util.MultiFormatLocalTimeDeserializer.class)
    private LocalTime selectedTime;
    private String urgency;
    
    // Additional Information
    private String additionalNotes;
    private List<FileUpload> uploadedFiles;
    
    // Metadata
    private String customerId;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Constructors
    public CustomerServiceModel() {
    }
    
    public CustomerServiceModel(String id, String vehicleType, String selectedVehicle,
                               String brand, String model, String fuelType,
                               String vehicleNumber, List<String> selectedServiceIds,
                               Double totalEstimatedPrice, Integer totalEstimatedDuration,
                               String serviceLocation, String manualAddress,
                               String serviceMode, LocalDate selectedDate,
                               LocalTime selectedTime, String urgency,
                               String additionalNotes, List<FileUpload> uploadedFiles,
                               String customerId, String status,
                               LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.vehicleType = vehicleType;
        this.selectedVehicle = selectedVehicle;
        this.brand = brand;
        this.model = model;
        this.fuelType = fuelType;
        this.vehicleNumber = vehicleNumber;
        this.selectedServiceIds = selectedServiceIds;
        this.totalEstimatedPrice = totalEstimatedPrice;
        this.totalEstimatedDuration = totalEstimatedDuration;
        this.serviceLocation = serviceLocation;
        this.manualAddress = manualAddress;
        this.serviceMode = serviceMode;
        this.selectedDate = selectedDate;
        this.selectedTime = selectedTime;
        this.urgency = urgency;
        this.additionalNotes = additionalNotes;
        this.uploadedFiles = uploadedFiles;
        this.customerId = customerId;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getVehicleType() {
        return vehicleType;
    }
    
    public void setVehicleType(String vehicleType) {
        this.vehicleType = vehicleType;
    }
    
    public String getSelectedVehicle() {
        return selectedVehicle;
    }
    
    public void setSelectedVehicle(String selectedVehicle) {
        this.selectedVehicle = selectedVehicle;
    }
    
    public String getBrand() {
        return brand;
    }
    
    public void setBrand(String brand) {
        this.brand = brand;
    }
    
    public String getModel() {
        return model;
    }
    
    public void setModel(String model) {
        this.model = model;
    }
    
    public String getFuelType() {
        return fuelType;
    }
    
    public void setFuelType(String fuelType) {
        this.fuelType = fuelType;
    }
    
    public String getVehicleNumber() {
        return vehicleNumber;
    }
    
    public void setVehicleNumber(String vehicleNumber) {
        this.vehicleNumber = vehicleNumber;
    }
    
    public List<String> getSelectedServiceIds() {
        return selectedServiceIds;
    }
    
    public void setSelectedServiceIds(List<String> selectedServiceIds) {
        this.selectedServiceIds = selectedServiceIds;
    }
    
    public Double getTotalEstimatedPrice() {
        return totalEstimatedPrice;
    }
    
    public void setTotalEstimatedPrice(Double totalEstimatedPrice) {
        this.totalEstimatedPrice = totalEstimatedPrice;
    }
    
    public Integer getTotalEstimatedDuration() {
        return totalEstimatedDuration;
    }
    
    public void setTotalEstimatedDuration(Integer totalEstimatedDuration) {
        this.totalEstimatedDuration = totalEstimatedDuration;
    }
    
    public String getServiceLocation() {
        return serviceLocation;
    }
    
    public void setServiceLocation(String serviceLocation) {
        this.serviceLocation = serviceLocation;
    }
    
    public String getManualAddress() {
        return manualAddress;
    }
    
    public void setManualAddress(String manualAddress) {
        this.manualAddress = manualAddress;
    }
    
    public String getServiceMode() {
        return serviceMode;
    }
    
    public void setServiceMode(String serviceMode) {
        this.serviceMode = serviceMode;
    }
    
    
    public LocalDate getSelectedDate() {
        return selectedDate;
    }
    
    public void setSelectedDate(LocalDate selectedDate) {
        this.selectedDate = selectedDate;
    }
    
    public LocalTime getSelectedTime() {
        return selectedTime;
    }
    
    public void setSelectedTime(LocalTime selectedTime) {
        this.selectedTime = selectedTime;
    }
    
    public String getUrgency() {
        return urgency;
    }
    
    public void setUrgency(String urgency) {
        this.urgency = urgency;
    }
    
    public String getAdditionalNotes() {
        return additionalNotes;
    }
    
    public void setAdditionalNotes(String additionalNotes) {
        this.additionalNotes = additionalNotes;
    }
    
    public List<FileUpload> getUploadedFiles() {
        return uploadedFiles;
    }
    
    public void setUploadedFiles(List<FileUpload> uploadedFiles) {
        this.uploadedFiles = uploadedFiles;
    }
    
    public String getCustomerId() {
        return customerId;
    }
    
    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    // Nested class for file uploads
    public static class FileUpload {
        private String fileName;
        private String fileUrl;
        private String fileType;
        private Long fileSize;
        private LocalDateTime uploadedAt;
        
        public FileUpload() {
        }
        
        public FileUpload(String fileName, String fileUrl, String fileType,
                         Long fileSize, LocalDateTime uploadedAt) {
            this.fileName = fileName;
            this.fileUrl = fileUrl;
            this.fileType = fileType;
            this.fileSize = fileSize;
            this.uploadedAt = uploadedAt;
        }
        
        public String getFileName() {
            return fileName;
        }
        
        public void setFileName(String fileName) {
            this.fileName = fileName;
        }
        
        public String getFileUrl() {
            return fileUrl;
        }
        
        public void setFileUrl(String fileUrl) {
            this.fileUrl = fileUrl;
        }
        
        public String getFileType() {
            return fileType;
        }
        
        public void setFileType(String fileType) {
            this.fileType = fileType;
        }
        
        public Long getFileSize() {
            return fileSize;
        }
        
        public void setFileSize(Long fileSize) {
            this.fileSize = fileSize;
        }
        
        public LocalDateTime getUploadedAt() {
            return uploadedAt;
        }
        
        public void setUploadedAt(LocalDateTime uploadedAt) {
            this.uploadedAt = uploadedAt;
        }
    }
}