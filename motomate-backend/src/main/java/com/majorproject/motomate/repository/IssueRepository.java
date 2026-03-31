package com.majorproject.motomate.repository;

import com.majorproject.motomate.model.IssueModel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IssueRepository extends MongoRepository<IssueModel, String> {

    Page<IssueModel> findByStatus(String status, Pageable pageable);

    Page<IssueModel> findByCategory(String category, Pageable pageable);

    Page<IssueModel> findByStatusAndCategory(String status, String category, Pageable pageable);

    @Query("{ $or: [ { 'subject': { $regex: ?0, $options: 'i' } }, { 'userName': { $regex: ?0, $options: 'i' } }, { 'userEmail': { $regex: ?0, $options: 'i' } } ] }")
    Page<IssueModel> searchIssues(String query, Pageable pageable);

    @Query("{ 'status': ?0, $or: [ { 'subject': { $regex: ?1, $options: 'i' } }, { 'userName': { $regex: ?1, $options: 'i' } } ] }")
    Page<IssueModel> searchByStatusAndKeyword(String status, String keyword, Pageable pageable);

    long countByStatus(String status);

    List<IssueModel> findTop10ByOrderByCreatedAtDesc();
}
