// ─────────────────────────────────────────────────────────────────────────────
// PATCH for BookService.jsx (or wherever you build the booking payload)
//
// Your existing BookService/multi-step form collects formData across steps.
// Step4Location now adds customerLatitude + customerLongitude to formData
// when Doorstep is selected.
//
// You only need to make sure these two fields are included when you POST
// to /api/customer/services.
//
// If you already spread the entire formData into the request body, no change
// is needed — the fields will be included automatically.
//
// If you build the payload manually, add the two fields shown below.
// ─────────────────────────────────────────────────────────────────────────────

import axios from 'axios';

const BASE = 'http://localhost:8080/api';
const cfg  = { withCredentials: true };

/**
 * Submit a new service booking.
 *
 * formData shape (relevant fields):
 *  {
 *    userId, vehicleType, selectedVehicle, brand, model, fuelType, vehicleNumber,
 *    serviceCenterId, serviceCenterName,
 *    selectedServiceIds, selectedServiceNames, totalEstimatedPrice, totalEstimatedDuration,
 *    serviceLocation, manualAddress,
 *    serviceMode,           // "Doorstep" | "Service Center"
 *    customerLatitude,      // ← NEW (set by Step4Location via useGeolocation)
 *    customerLongitude,     // ← NEW
 *    selectedDate, selectedTime, urgency,
 *    additionalNotes, uploadedFiles,
 *    customerId, status,
 *  }
 */
export const submitBooking = async (formData) => {
  const payload = {
    userId:               formData.userId,
    vehicleType:          formData.vehicleType,
    selectedVehicle:      formData.selectedVehicle,
    brand:                formData.brand,
    model:                formData.model,
    fuelType:             formData.fuelType,
    vehicleNumber:        formData.vehicleNumber,
    serviceCenterId:      formData.serviceCenterId,
    serviceCenterName:    formData.serviceCenterName,
    selectedServiceIds:   formData.selectedServiceIds,
    selectedServiceNames: formData.selectedServiceNames,
    totalEstimatedPrice:  formData.totalEstimatedPrice,
    totalEstimatedDuration: formData.totalEstimatedDuration,
    serviceLocation:      formData.serviceLocation,
    manualAddress:        formData.manualAddress,
    serviceMode:          formData.serviceMode,

    // ── NEW: GPS coordinates for Doorstep auto-assignment ─────────────────
    customerLatitude:     formData.customerLatitude  ?? null,
    customerLongitude:    formData.customerLongitude ?? null,
    // ─────────────────────────────────────────────────────────────────────

    selectedDate:         formData.selectedDate,
    selectedTime:         formData.selectedTime,
    urgency:              formData.urgency,
    additionalNotes:      formData.additionalNotes,
    uploadedFiles:        formData.uploadedFiles ?? [],
    customerId:           formData.customerId ?? formData.userId,
    status:               formData.status ?? 'PENDING',
  };

  const response = await axios.post(`${BASE}/customer/services`, payload, cfg);
  return response.data;
};

/**
 * Update an existing booking (edit flow).
 */
export const updateBooking = async (bookingId, formData) => {
  const response = await axios.put(
    `${BASE}/customer/services/${bookingId}`,
    formData,
    cfg
  );
  return response.data;
};

/**
 * Fetch a single booking by ID (used in CurrentServiceStatus).
 */
export const fetchBookingById = async (bookingId) => {
  const response = await axios.get(`${BASE}/customer/services/${bookingId}`, cfg);
  return response.data;
};

/**
 * Fetch all bookings for a customer.
 */
export const fetchCustomerBookings = async (userId) => {
  const response = await axios.get(`${BASE}/customer/services/user/${userId}`, cfg);
  return response.data;
};
