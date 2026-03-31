package com.majorproject.motomate.repository;

import com.majorproject.motomate.model.UserModel;
import com.majorproject.motomate.model.UserRoles;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<UserModel, String> {

    Optional<UserModel> findByEmail(String email);

    boolean existsByEmail(String email);

    List<UserModel> findByRole(UserRoles role);

    Page<UserModel> findByRole(UserRoles role, Pageable pageable);

    Page<UserModel> findByActive(boolean active, Pageable pageable);

    @Query("{ $or: [ { 'name': { $regex: ?0, $options: 'i' } }, { 'email': { $regex: ?0, $options: 'i' } }, { 'phone': { $regex: ?0, $options: 'i' } } ] }")
    Page<UserModel> searchUsers(String query, Pageable pageable);

    @Query("{ 'role': ?0, $or: [ { 'name': { $regex: ?1, $options: 'i' } }, { 'email': { $regex: ?1, $options: 'i' } } ] }")
    Page<UserModel> searchByRoleAndKeyword(String role, String keyword, Pageable pageable);

    long countByRole(UserRoles role);

    long countByActive(boolean active);

    List<UserModel> findTop10ByOrderByIdDesc();
}
