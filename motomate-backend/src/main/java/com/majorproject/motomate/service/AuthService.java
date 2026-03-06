package com.majorproject.motomate.service;
import com.majorproject.motomate.model.UserModel;
import com.majorproject.motomate.repository.UserRepository;
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
        UserModel user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        System.out.println("=== PASSWORD DEBUG ===");
        System.out.println("Raw password received: '" + password + "'");
        System.out.println("Stored hash: '" + user.getPassword() + "'");
        System.out.println("BCrypt matches: " + passwordEncoder.matches(password, user.getPassword()));
        System.out.println("Is active: " + user.isActive());
        System.out.println("=====================");

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        if (!user.isActive()) {
            throw new RuntimeException("Account is deactivated. Contact support.");
        }

        System.out.println("User " + email + " authenticated successfully. Generating token...");
        String token = jwtService.generateToken(user);
        System.out.println("Generated token for user " + email + ": " + token);
        return token;
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