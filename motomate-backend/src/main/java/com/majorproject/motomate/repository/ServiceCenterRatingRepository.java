package com.majorproject.motomate.repository;

import com.majorproject.motomate.model.ServiceCenterRating;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ServiceCenterRatingRepository extends MongoRepository<ServiceCenterRating, String> {

    List<ServiceCenterRating> findByServiceCenterId(String serviceCenterId);

    Optional<ServiceCenterRating> findByBookingId(String bookingId);

    long countByServiceCenterId(String serviceCenterId);
}
