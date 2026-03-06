package com.majorproject.motomate.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import com.majorproject.motomate.model.UserModel;
import com.majorproject.motomate.model.UserRoles;
import com.majorproject.motomate.repository.UserRepository;

@Component
public class AdminSeeder implements CommandLineRunner {
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Override
public void run(String... args) throws Exception {
    String adminEmail = "admin@motomate.com";
    if (userRepository.findByEmail(adminEmail).isEmpty()) {
        UserModel admin = new UserModel();
        admin.setName("Admin");
        admin.setEmail(adminEmail);
        admin.setPassword(passwordEncoder.encode("admin@MotoMate123"));
        admin.setRole(UserRoles.ADMIN);
        admin.setActive(true);
        UserModel saved = userRepository.save(admin);
        System.out.println("Seeded admin role: " + saved.getRole());
        System.out.println("Seeded admin active: " + saved.isActive());
    } else {
        UserModel existing = userRepository.findByEmail(adminEmail).get();
        System.out.println("Existing admin role: " + existing.getRole());
        System.out.println("Existing admin active: " + existing.isActive());
    }
}
}
