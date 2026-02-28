package com.majorproject.motomate.service;

import com.majorproject.motomate.model.CustomerServiceModel;
import com.majorproject.motomate.repository.CustomerServiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.logging.Logger;

@Service
public class CustomerService {
    
    @Autowired
    private CustomerServiceRepository customerServiceRepository;
    
    // 1. Create service
    public CustomerServiceModel createService(CustomerServiceModel customerService) {
        Logger logger = Logger.getLogger(CustomerService.class.getName());
        logger.info("Creating customer service: " + customerService);
        customerService.setCreatedAt(LocalDateTime.now());
        return customerServiceRepository.save(customerService);
    }
    
    // 2. Get all services
    public List<CustomerServiceModel> getAllServices() {
        return customerServiceRepository.findAll();
    }
    
    // 3. Edit service
    public CustomerServiceModel editService(String id, CustomerServiceModel updatedService) {
        Optional<CustomerServiceModel> existingServiceOpt = customerServiceRepository.findById(id);
        if (existingServiceOpt.isPresent()) {
            CustomerServiceModel existingService = existingServiceOpt.get();
            
            existingService.setVehicleType(updatedService.getVehicleType());
            existingService.setSelectedVehicle(updatedService.getSelectedVehicle());
            existingService.setBrand(updatedService.getBrand());
            existingService.setModel(updatedService.getModel());
            existingService.setFuelType(updatedService.getFuelType());
            existingService.setVehicleNumber(updatedService.getVehicleNumber());
           // existingService.setSelectedServices(updatedService.getSelectedServices());
            existingService.setServiceLocation(updatedService.getServiceLocation());
            existingService.setManualAddress(updatedService.getManualAddress());
            existingService.setServiceMode(updatedService.getServiceMode());
            existingService.setSelectedDate(updatedService.getSelectedDate());
            existingService.setSelectedTime(updatedService.getSelectedTime());
            existingService.setUrgency(updatedService.getUrgency());
            existingService.setAdditionalNotes(updatedService.getAdditionalNotes());
            existingService.setUploadedFiles(updatedService.getUploadedFiles());
            
            return customerServiceRepository.save(existingService);
        }
        return null;
    }
}