package com.majorproject.motomate.service;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.majorproject.motomate.model.UserModel;
import org.springframework.stereotype.Service;

import java.util.Date;

@Service
public class JwtService {

    private static final String SECRET_KEY = "your-secret-key-change-this-in-production";
    private static final long EXPIRATION_TIME = 86400000; // 24 hours

    public String generateToken(UserModel user) {
        return JWT.create()
                .withSubject(user.getEmail())
                .withClaim("userId", user.getId())
                .withClaim("role", user.getRole().toString())
                .withClaim("name", user.getName())
                .withIssuedAt(new Date())
                .withExpiresAt(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .sign(Algorithm.HMAC256(SECRET_KEY));
    }

    public DecodedJWT verifyToken(String token) {
        return JWT.require(Algorithm.HMAC256(SECRET_KEY))
                .build()
                .verify(token);
    }

    public String getUserIdFromToken(String token) {
        return verifyToken(token).getClaim("userId").asString();
    }

    public String getRoleFromToken(String token) {
        return verifyToken(token).getClaim("role").asString();
    }

    public String getEmailFromToken(String token) {
        return verifyToken(token).getSubject();
    }
}