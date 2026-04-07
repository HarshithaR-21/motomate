package com.majorproject.motomate.service;

import com.majorproject.motomate.enums.ApprovalStatus;
import com.majorproject.motomate.model.FleetManagerRegistration;
import com.majorproject.motomate.model.ServiceCenterRegistration;
import com.majorproject.motomate.model.UserModel;
import com.majorproject.motomate.model.UserRoles;
import com.majorproject.motomate.repository.FleetManagerRegistrationRepository;
import com.majorproject.motomate.repository.ServiceCenterRegistrationRepository;
import com.majorproject.motomate.repository.UserRepository;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ServiceCenterRegistrationRepository serviceCenterRepo;

    @Autowired
    private FleetManagerRegistrationRepository fleetManagerRepo;

    public UserModel registerUser(UserModel user) {
        // Check if user already exists
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered");
        }

        // Encrypt password
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        // Save user
        return userRepository.save(user);
    }

    public String login(String email, String password) {
        // 1. Check UserModel (customers, admin, workers)
        Optional<UserModel> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            UserModel user = userOpt.get();
            if (!passwordEncoder.matches(password, user.getPassword()))
                throw new RuntimeException("Invalid credentials");
            if (!user.isActive())
                throw new RuntimeException("Account is deactivated. Contact support.");
            return jwtService.generateToken(user);
        }

        // 2. Check ServiceCenterRegistration
        Optional<ServiceCenterRegistration> scOpt = serviceCenterRepo.findByEmail(email);
        if (scOpt.isPresent()) {
            ServiceCenterRegistration sc = scOpt.get();
            if (!passwordEncoder.matches(password, sc.getPasswordHash()))
                throw new RuntimeException("Invalid credentials");
            if (sc.getApprovalStatus() != ApprovalStatus.APPROVED)
                throw new RuntimeException("Your account is pending approval.");
            UserModel tempUser = new UserModel();
            tempUser.setId(sc.getId());
            tempUser.setEmail(sc.getEmail());
            tempUser.setName(sc.getOwnerName());
            tempUser.setRole(UserRoles.SERVICE_CENTER_OWNER);
            tempUser.setActive(true);
            return jwtService.generateToken(tempUser);
        }

        // 3. Check FleetManagerRegistration
        Optional<FleetManagerRegistration> fmOpt = fleetManagerRepo.findByEmail(email);
        if (fmOpt.isPresent()) {
            FleetManagerRegistration fm = fmOpt.get();
            if (!passwordEncoder.matches(password, fm.getPasswordHash()))
                throw new RuntimeException("Invalid credentials");
            if (fm.getApprovalStatus() != ApprovalStatus.APPROVED)
                throw new RuntimeException("Your account is pending approval.");
            UserModel tempUser = new UserModel();
            tempUser.setId(fm.getId());
            tempUser.setEmail(fm.getEmail());
            tempUser.setName(fm.getManagerName());
            tempUser.setRole(UserRoles.FLEET_MANAGER);
            tempUser.setActive(true);
            return jwtService.generateToken(tempUser);
        }

        throw new RuntimeException("Invalid credentials");
    }

public String getIdByEmail(String email) {
    Optional<ServiceCenterRegistration> sc = serviceCenterRepo.findByEmail(email);
    if (sc.isPresent()) {
        if (sc.get().getApprovalStatus() != ApprovalStatus.APPROVED)
            throw new RuntimeException("Your account is pending approval.");
        return sc.get().getId();
    }

    Optional<FleetManagerRegistration> fm = fleetManagerRepo.findByEmail(email);
    if (fm.isPresent()) {
        if (fm.get().getApprovalStatus() != ApprovalStatus.APPROVED)
            throw new RuntimeException("Your account is pending approval.");
        return fm.get().getId();
    }

    throw new RuntimeException("User not found");
}

public String getNameByEmail(String email) {
    Optional<ServiceCenterRegistration> sc = serviceCenterRepo.findByEmail(email);
    if (sc.isPresent()) {
        if (sc.get().getApprovalStatus() != ApprovalStatus.APPROVED)
            throw new RuntimeException("Your account is pending approval.");
        return sc.get().getOwnerName();
    }

    Optional<FleetManagerRegistration> fm = fleetManagerRepo.findByEmail(email);
    if (fm.isPresent()) {
        if (fm.get().getApprovalStatus() != ApprovalStatus.APPROVED)
            throw new RuntimeException("Your account is pending approval.");
        return fm.get().getManagerName();
    }

    throw new RuntimeException("User not found");
}

public String getRoleByEmail(String email) {
    Optional<ServiceCenterRegistration> sc = serviceCenterRepo.findByEmail(email);
    if (sc.isPresent()) {
        if (sc.get().getApprovalStatus() != ApprovalStatus.APPROVED)
            throw new RuntimeException("Your account is pending approval.");
        return UserRoles.SERVICE_CENTER_OWNER.toString();
    }

    Optional<FleetManagerRegistration> fm = fleetManagerRepo.findByEmail(email);
    if (fm.isPresent()) {
        if (fm.get().getApprovalStatus() != ApprovalStatus.APPROVED)
            throw new RuntimeException("Your account is pending approval.");
        return UserRoles.FLEET_MANAGER.toString();
    }

    throw new RuntimeException("User not found");
}

    public UserModel getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
    

    public UserModel getUserById(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // If using jjwt (io.jsonwebtoken)
    public String getEmailFromToken(String token) {
        return jwtService.getEmailFromToken(token);
    }

    // Add this method for signup token generation
    public String generateToken(UserModel user) {
        return jwtService.generateToken(user);
    }

    public UserModel updateUser(UserModel user) {
        return userRepository.save(user);
    }
}