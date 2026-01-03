package com.majorproject.motomate.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.majorproject.motomate.service.CustomerService;
import com.majorproject.motomate.model.Customer;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;

import java.util.Date;

@RestController
@RequestMapping("/api/signup")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class CustomerController {
    @Autowired
    private CustomerService customerService;

    // NOTE: For production, load this from secure config/environment
    private static final String JWT_SECRET = "change_this_to_a_strong_secret";
    private static final long JWT_EXP_MS = 24 * 60 * 60 * 1000; // 24h

    @PostMapping("/customer")
    public ResponseEntity<?> register(@RequestBody Customer customer, HttpServletResponse response) {
        Customer saved = customerService.registerCustomer(customer);

        // Create JWT token
        Algorithm alg = Algorithm.HMAC256(JWT_SECRET);
        String token = JWT.create()
                .withSubject(saved.getId() != null ? saved.getId() : "")
                .withClaim("email", saved.getEmail())
                .withIssuedAt(new Date())
                .withExpiresAt(new Date(System.currentTimeMillis() + JWT_EXP_MS))
                .sign(alg);

        Cookie idCookie = new Cookie("userId", saved.getId() != null ? saved.getId() : "");
        idCookie.setHttpOnly(true);
        idCookie.setPath("/");
        response.addCookie(idCookie);

        Cookie tokenCookie = new Cookie("sessionToken", token);
        tokenCookie.setHttpOnly(true);
        tokenCookie.setPath("/");
        response.addCookie(tokenCookie);

        // Remove password from response body
        saved.setPassword(null);
        return ResponseEntity.ok(saved);
    }
}
