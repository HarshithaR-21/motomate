// ─── SCOServiceRepository.java ─────────────────────────────────────────────
package com.majorproject.motomate.repository;

import com.majorproject.motomate.model.SCOService;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SCOServiceRepository extends MongoRepository<SCOService, String> {
    List<SCOService> findByServiceCenterId(String serviceCenterId);
    List<SCOService> findByServiceCenterIdAndActive(String serviceCenterId, boolean active);
    long countByServiceCenterId(String serviceCenterId);
}