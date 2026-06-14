package com.majorproject.motomate.repository;

import com.majorproject.motomate.model.SOSRequest;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SOSRequestRepository extends MongoRepository<SOSRequest, String> {

    List<SOSRequest> findByCustomerIdOrderByCreatedAtDesc(String customerId);

    List<SOSRequest> findByCustomerIdAndStatusIn(String customerId, List<String> statuses);

    long countByCustomerIdAndStatusIn(String customerId, List<String> statuses);

    List<SOSRequest> findByAssignedServiceCenterIdAndStatusIn(String serviceCenterId, List<String> statuses);

    List<SOSRequest> findByAssignedWorkerIdAndStatusIn(String workerId, List<String> statuses);

    List<SOSRequest> findByAssignedWorkerIdAndStatusNot(String workerId, String status);

    List<SOSRequest> findByStatusIn(List<String> statuses);

    List<SOSRequest> findAllByOrderByPriorityScoreDescCreatedAtAsc();

    long countByAssignedWorkerIdAndStatus(String workerId, String status);

    long countByAssignedWorkerIdAndStatusIn(String workerId, List<String> statuses);

    /**
     * Find SOS requests broadcast to a specific service center that haven't been
     * accepted by anyone yet (still in SOS_SUBMITTED state).
     */
    List<SOSRequest> findByNotifiedServiceCenterIdsContainingAndStatus(
            String serviceCenterId, String status);

    /**
     * Find all SOS requests broadcast to a service center — both pending and accepted by them.
     */
    List<SOSRequest> findByNotifiedServiceCenterIdsContainingAndStatusIn(
            String serviceCenterId, List<String> statuses);
}
