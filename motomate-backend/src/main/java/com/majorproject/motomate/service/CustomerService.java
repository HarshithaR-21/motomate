package com.majorproject.motomate.service;

import com.majorproject.motomate.model.CustomerServiceModel;
import com.majorproject.motomate.model.SCOService;
import com.majorproject.motomate.model.SCOServiceRequest;
import com.majorproject.motomate.model.UserModel;
import com.majorproject.motomate.repository.CustomerServiceRepository;
import com.majorproject.motomate.repository.SCOServiceRepository;
import com.majorproject.motomate.repository.SCOServiceRequestRepository;
import com.majorproject.motomate.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.logging.Logger;
import java.util.stream.Collectors;

@Service
public class CustomerService {

    @Autowired
    private CustomerServiceRepository customerServiceRepository;

    @Autowired
    private SCOServiceRequestRepository scoServiceRequestRepository;

    @Autowired
    private SCOServiceRepository scoServiceRepository;

    @Autowired
    private UserRepository userRepository;

    // 1. Create service booking → also creates a pending SCOServiceRequest
    public CustomerServiceModel createService(CustomerServiceModel customerService) {
        Logger logger = Logger.getLogger(CustomerService.class.getName());
        logger.info("Creating customer service booking: " + customerService);
        customerService.setCreatedAt(LocalDateTime.now());
        CustomerServiceModel saved = customerServiceRepository.save(customerService);

        // Auto-route: create a PENDING SCOServiceRequest for the chosen service center
        if (customerService.getServiceCenterId() != null && !customerService.getServiceCenterId().isBlank()) {
            try {
                createSCOServiceRequest(saved);
            } catch (Exception e) {
                logger.warning("Failed to create SCOServiceRequest: " + e.getMessage());
            }
        }

        return saved;
    }

    private void createSCOServiceRequest(CustomerServiceModel booking) {
        // Fetch service details for names/price/duration
        List<SCOService> services = booking.getSelectedServiceIds() != null
                ? booking.getSelectedServiceIds().stream()
                        .map(id -> scoServiceRepository.findById(id).orElse(null))
                        .filter(s -> s != null)
                        .collect(Collectors.toList())
                : List.of();

        List<String> serviceNames = services.stream().map(SCOService::getName).collect(Collectors.toList());
        double totalPrice = services.stream().mapToDouble(s -> s.getPrice() != null ? s.getPrice() : 0).sum();
        int totalDuration = services.stream().mapToInt(s -> s.getDurationMinutes() != null ? s.getDurationMinutes() : 0)
                .sum();

        // Fetch customer info
        String customerName = "";
        String customerPhone = "";
        String customerEmail = "";
        if (booking.getUserId() != null) {
            Optional<UserModel> userOpt = userRepository.findById(booking.getUserId());
            if (userOpt.isPresent()) {
                UserModel user = userOpt.get();
                customerName = user.getName() != null ? user.getName() : "";
                customerPhone = user.getPhone() != null ? user.getPhone() : "";
                customerEmail = user.getEmail() != null ? user.getEmail() : "";
            }
        }

        SCOServiceRequest req = SCOServiceRequest.builder()
                .serviceCenterId(booking.getServiceCenterId())
                .customerId(booking.getUserId())
                .customerName(customerName)
                .customerPhone(customerPhone)
                .customerEmail(customerEmail)
                .vehicleType(booking.getVehicleType())
                .brand(booking.getBrand())
                .vehicleModel(booking.getModel())
                .fuelType(booking.getFuelType())
                .vehicleNumber(booking.getVehicleNumber())
                .serviceNames(serviceNames.isEmpty() ? booking.getSelectedServiceNames() : serviceNames)
                .totalPrice(totalPrice > 0 ? totalPrice : booking.getTotalEstimatedPrice())
                .totalDurationMinutes(totalDuration > 0 ? totalDuration : booking.getTotalEstimatedDuration())
                .scheduledDate(booking.getSelectedDate())
                .scheduledTime(booking.getSelectedTime())
                .urgency(booking.getUrgency() != null ? booking.getUrgency().toUpperCase() : "NORMAL")
                .serviceMode(booking.getServiceMode())
                .address(booking.getManualAddress())
                .additionalNotes(booking.getAdditionalNotes())
                .status("PENDING")
                .build();

        SCOServiceRequest savedReq = scoServiceRequestRepository.save(req);
        // Link SCO request ID back to customer booking so frontend can match SSE events
        booking.setScoRequestId(savedReq.getId());
        customerServiceRepository.save(booking);
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