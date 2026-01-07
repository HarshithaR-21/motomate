package com.majorproject.motomate.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import com.majorproject.motomate.model.UserModel;
import com.majorproject.motomate.model.UserRoles;

import java.util.Optional;
import java.util.List;

public interface UserRepository extends MongoRepository<UserModel, String> {
    Optional<UserModel> findByEmail(String email);
    boolean existsByEmail(String email);
    List<UserModel> findByRole(UserRoles role);
}