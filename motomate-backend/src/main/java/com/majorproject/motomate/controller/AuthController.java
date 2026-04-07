package com.majorproject.motomate.controller;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.majorproject.motomate.model.UserModel;
import com.majorproject.motomate.model.UserRoles;
import com.majorproject.motomate.service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    // Unified signup endpoint
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest request, HttpServletResponse response) {
        try {
            UserModel user = new UserModel();
            user.setEmail(request.getEmail());
            user.setPassword(request.getPassword());
            user.setName(request.getName());
            user.setPhone(request.getPhone());
            user.setRole(request.getRole());

            // Set address fields
            user.setArea(request.getArea());
            user.setCity(request.getCity());
            user.setState(request.getState());
            user.setPinCode(request.getPinCode());

            // Set role-specific fields
            if (request.getRole() == UserRoles.SERVICE_CENTER_OWNER) {
                user.setBusinessName(request.getBusinessName());
            } else if (request.getRole() == UserRoles.WORKER) {
                user.setLicenseNumber(request.getLicenseNumber());
            } else if (request.getRole() == UserRoles.FLEET_MANAGER) {
                user.setCompanyName(request.getCompanyName());
            }

            UserModel savedUser = authService.registerUser(user);

            // Generate token
            String token = authService.generateToken(savedUser);

            // Set cookie
            Cookie cookie = new Cookie("jwt", token);
            cookie.setHttpOnly(true);
            cookie.setSecure(false); // Set to true in production with HTTPS
            cookie.setPath("/");
            cookie.setMaxAge(7 * 24 * 60 * 60); // 7 days
            cookie.setAttribute("SameSite", "Lax");
            response.addCookie(cookie);

            return ResponseEntity.ok(new AuthResponse(
                    "Registration successful",
                    savedUser.getId(),
                    savedUser.getEmail(),
                    savedUser.getRole().toString()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    // Unified login endpoint for all roles
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpServletResponse response) {
        try {
            String token = authService.login(request.getEmail(), request.getPassword());

            // Get user details from whichever collection they exist in
            String email = request.getEmail();
            String id, name, role;

            // Try UserModel first
            try {
                UserModel user = authService.getUserByEmail(email);
                id = user.getId();
                name = user.getName();
                role = user.getRole().toString();
            } catch (Exception e) {
                // Fall back to ServiceCenter or FleetManager
                id = authService.getIdByEmail(email);
                name = authService.getNameByEmail(email);
                role = authService.getRoleByEmail(email);
            }

            Cookie cookie = new Cookie("jwt", token);
            cookie.setHttpOnly(true);
            cookie.setSecure(false);
            cookie.setPath("/");
            cookie.setMaxAge(7 * 24 * 60 * 60);
            cookie.setAttribute("SameSite", "Lax");
            response.addCookie(cookie);

            return ResponseEntity.ok(new LoginResponse("Login successful", token, id, email, name, role));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/admin/login")
    public ResponseEntity<?> adminLogin(@RequestBody LoginRequest request, HttpServletResponse response) {
        try {
            // 1. First verify credentials (this checks password hash)
            String token = authService.login(request.getEmail(), request.getPassword());
            System.out.println("Generated token: " + token);
            System.out.println("Login request for email: " + request.getEmail());
            System.out.println("Login request for password: " + request.getPassword());
            // 2. Then fetch user to check role
            UserModel user = authService.getUserByEmail(request.getEmail());

            // 3. Reject if not an admin
            if (user == null || user.getRole() != UserRoles.ADMIN) {
                return ResponseEntity.status(403).body(new ErrorResponse("Access denied: Not an admin"));
            }

            Cookie cookie = new Cookie("jwt", token);
            cookie.setHttpOnly(true);
            cookie.setSecure(false);
            cookie.setPath("/");
            cookie.setMaxAge(7 * 24 * 60 * 60);
            cookie.setAttribute("SameSite", "Lax");
            response.addCookie(cookie);
            System.out.println(cookie.getName() + " cookie set with value: " + cookie.getValue());

            return ResponseEntity.ok(new LoginResponse(
                    "Admin login successful",
                    token,
                    user.getId(),
                    user.getEmail(),
                    user.getName(),
                    user.getRole().toString()));
        } catch (Exception e) {
            System.out.println("Admin login failed: " + e.getMessage());
            return ResponseEntity.status(401).body(new ErrorResponse(e.getMessage()));
        }
    }

    // Logout - clear the cookie
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        Cookie cookie = new Cookie("jwt", null);
        cookie.setHttpOnly(true);
        cookie.setSecure(false);
        cookie.setPath("/");
        cookie.setMaxAge(0); // Delete the cookie
        response.addCookie(cookie);

        return ResponseEntity.ok(new MessageResponse("Logout successful"));
    }

    // Get current user info from cookie
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@CookieValue(name = "jwt", required = false) String token) {
        try {
            if (token == null || token.isEmpty()) {
                return ResponseEntity.status(401).body(new ErrorResponse("No authentication token found"));
            }

            String email = authService.getEmailFromToken(token);
            String id, name, role;

            // Try UserModel first (customers, admin, workers)
            try {
                UserModel user = authService.getUserByEmail(email);
                id = user.getId();
                name = user.getName();
                role = user.getRole().toString();
            } catch (Exception e) {
                // Fall back to ServiceCenter or FleetManager collections
                id = authService.getIdByEmail(email);
                name = authService.getNameByEmail(email);
                role = authService.getRoleByEmail(email);
            }

            return ResponseEntity.ok(new LoginResponse(
                    "User fetched successfully",
                    token,
                    id,
                    email,
                    name,
                    role));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(new ErrorResponse("Invalid token"));
        }
    }
}

// DTOs
class SignupRequest {
    private String email;
    private String password;
    private String name;
    private String phone;
    private UserRoles role;
    private String businessName;
    private String licenseNumber;
    private String companyName;
    private String area;
    private String city;
    private String state;
    private String pinCode;

    // Getters and Setters
    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public UserRoles getRole() {
        return role;
    }

    public void setRole(UserRoles role) {
        this.role = role;
    }

    public String getBusinessName() {
        return businessName;
    }

    public void setBusinessName(String businessName) {
        this.businessName = businessName;
    }

    public String getLicenseNumber() {
        return licenseNumber;
    }

    public void setLicenseNumber(String licenseNumber) {
        this.licenseNumber = licenseNumber;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getArea() {
        return area;
    }

    public void setArea(String area) {
        this.area = area;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getPinCode() {
        return pinCode;
    }

    public void setPinCode(String pinCode) {
        this.pinCode = pinCode;
    }
}

class LoginRequest {
    private String email;
    private String password;
    private UserRoles role;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public UserRoles getRole() {
        return role;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}

class LoginResponse {
    private String message;
    private String token;
    private String userId;
    private String email;
    private String name;
    private String role;

    public LoginResponse(String message, String token, String userId, String email, String name, String role) {
        this.message = message;
        this.token = token;
        this.userId = userId;
        this.email = email;
        this.name = name;
        this.role = role;
    }

    // Getters
    public String getMessage() {
        return message;
    }

    public String getToken() {
        return token;
    }

    public String getUserId() {
        return userId;
    }

    public String getEmail() {
        return email;
    }

    public String getName() {
        return name;
    }

    public String getRole() {
        return role;
    }
}

class AuthResponse {
    private String message;
    private String userId;
    private String email;
    private String role;

    public AuthResponse(String message, String userId, String email, String role) {
        this.message = message;
        this.userId = userId;
        this.email = email;
        this.role = role;
    }

    // Getters
    public String getMessage() {
        return message;
    }

    public String getUserId() {
        return userId;
    }

    public String getEmail() {
        return email;
    }

    public String getRole() {
        return role;
    }
}

class ErrorResponse {
    private String error;

    public ErrorResponse(String error) {
        this.error = error;
    }

    public String getError() {
        return error;
    }
}

class MessageResponse {
    private String message;

    public MessageResponse(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }
}