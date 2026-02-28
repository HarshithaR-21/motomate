package com.majorproject.motomate.controller;

import com.majorproject.motomate.model.CustomerServiceModel;
import com.majorproject.motomate.service.CustomerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.logging.Logger;

@RestController
@RequestMapping("/api/services")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class CustomerServiceController {
    
    @Autowired
    private CustomerService customerServiceService;
    
    // 1. Create service
    @PostMapping("/book-service")
    public ResponseEntity<?> createService(@RequestBody CustomerServiceModel customerService) {
        Logger logger = Logger.getLogger(CustomerServiceController.class.getName());
        try {
            logger.info("Attempting to create service: " + customerService);
            CustomerServiceModel created = customerServiceService.createService(customerService);
            logger.info("Successfully created service with ID: " + created.getId());
            return new ResponseEntity<>(created, HttpStatus.CREATED);
        } catch (Exception e) {
            logger.severe("Error creating service: " + e.getMessage());
            return new ResponseEntity<>("Error: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    // 2. Get all services
    @GetMapping("/all")
    public ResponseEntity<List<CustomerServiceModel>> getAllServices() {
        try {
            List<CustomerServiceModel> services = customerServiceService.getAllServices();
            return new ResponseEntity<>(services, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }
    
    // 3. Edit service
    @PutMapping("/edit/{id}")
    public ResponseEntity<?> editService(@PathVariable String id, @RequestBody CustomerServiceModel customerService) {
        try {
            CustomerServiceModel updated = customerServiceService.editService(id, customerService);
            if (updated != null) {
                return new ResponseEntity<>(updated, HttpStatus.OK);
            } else {
                return new ResponseEntity<>("Service not found", HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            return new ResponseEntity<>("Error: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}