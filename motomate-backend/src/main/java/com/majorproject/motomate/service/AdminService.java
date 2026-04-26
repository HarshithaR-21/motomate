package com.majorproject.motomate.service;

import com.majorproject.motomate.enums.ApprovalStatus;
import com.majorproject.motomate.model.*;
import com.majorproject.motomate.notification.EmailNotificationService;
import com.majorproject.motomate.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;


import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminService {

    @Autowired private UserRepository userRepository;
    
    @Autowired private ServiceCenterRegistrationRepository serviceCenterRepo;
    @Autowired private FleetManagerRegistrationRepository fleetManagerRepo;
    @Autowired private CustomerServiceRepository customerServiceRepo;
    @Autowired private IssueRepository issueRepository;
    @Autowired private EmailNotificationService emailService;

    // ═══════════════════════════════════════════════════════════════
    //  DASHBOARD STATS
    // ═══════════════════════════════════════════════════════════════

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new LinkedHashMap<>();

        // User counts
        long totalUsers      = userRepository.count();
        long totalCustomers  = userRepository.countByRole(UserRoles.CUSTOMER);
        long totalWorkers    = userRepository.countByRole(UserRoles.WORKER);
        //long totalSCOwners   = userRepository.countByRole(UserRoles.SERVICE_CENTER_OWNER);
        //long totalFleet      = userRepository.countByRole(UserRoles.FLEET_MANAGER);

        stats.put("totalUsers",          totalUsers);
        stats.put("totalCustomers",      totalCustomers);
        stats.put("totalWorkers",        totalWorkers);
        stats.put("totalServiceCenters", serviceCenterRepo.count());
        stats.put("totalFleetManagers",  fleetManagerRepo.count());

        // Pending verifications
        long pendingSC    = serviceCenterRepo.findByApprovalStatus(ApprovalStatus.PENDING).size();
        long pendingFM    = fleetManagerRepo.findByApprovalStatus(ApprovalStatus.PENDING).size();
        long pendingVerif = pendingSC + pendingFM;
        stats.put("pendingVerifications",   pendingVerif);
        stats.put("pendingServiceCenters",  pendingSC);
        stats.put("pendingFleetManagers",   pendingFM);

        // Approved counts
        long approvedServiceCenterCount = serviceCenterRepo.findByApprovalStatus(ApprovalStatus.APPROVED).size();
        long approvedFleetManagerCount  = fleetManagerRepo.findByApprovalStatus(ApprovalStatus.APPROVED).size();

        stats.put("approvedServiceCenters", approvedServiceCenterCount);
        stats.put("approvedFleetManagers",  approvedFleetManagerCount);

        // Bookings / Services
        long totalBookings = customerServiceRepo.count();
        stats.put("totalBookings", totalBookings);
        stats.put("ongoingServices",  customerServiceRepo.countByStatus("ONGOING"));
        stats.put("completedServices", customerServiceRepo.countByStatus("COMPLETED"));

        // Issues
        long openIssues       = issueRepository.countByStatus("OPEN");
        long inProgressIssues = issueRepository.countByStatus("IN_PROGRESS");
        stats.put("openIssues",       openIssues);
        stats.put("inProgressIssues", inProgressIssues);
        stats.put("pendingIssues",    openIssues + inProgressIssues);
        stats.put("resolvedIssues",   issueRepository.countByStatus("RESOLVED"));

        // Recent activity
        stats.put("recentVerifications",  buildRecentVerifications());
        stats.put("recentIssues",         buildRecentIssues());
        stats.put("recentBookings",        buildRecentBookings());

        // Charts
        stats.put("serviceRequestsChart",  buildServiceRequestsOverTime());
        stats.put("userRolesDistribution", buildUserRolesDistribution());
        stats.put("serviceTrendChart",     buildServiceTrendData());

        return stats;
    }

    private List<Map<String, Object>> buildRecentVerifications() {
        List<Map<String, Object>> result = new ArrayList<>();

        serviceCenterRepo.findAll(PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt")))
            .forEach(sc -> {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("id",     sc.getId());
                item.put("name",   sc.getCenterName());
                item.put("type",   "service-center");
                item.put("city",   sc.getCity());
                item.put("status", sc.getApprovalStatus().name().toLowerCase());
                item.put("time",   sc.getCreatedAt());
                result.add(item);
            });

        fleetManagerRepo.findAll(PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt")))
            .forEach(fm -> {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("id",     fm.getId());
                item.put("name",   fm.getCompanyName());
                item.put("type",   "fleet-manager");
                item.put("city",   fm.getCity());
                item.put("status", fm.getApprovalStatus().name().toLowerCase());
                item.put("time",   fm.getCreatedAt());
                result.add(item);
            });

        result.sort((a, b) -> {
            LocalDateTime ta = (LocalDateTime) a.get("time");
            LocalDateTime tb = (LocalDateTime) b.get("time");
            if (ta == null || tb == null) return 0;
            return tb.compareTo(ta);
        });

        return result.stream().limit(8).collect(Collectors.toList());
    }

    private List<Map<String, Object>> buildRecentIssues() {
        return issueRepository.findTop10ByOrderByCreatedAtDesc().stream().map(issue -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id",       issue.getId());
            item.put("ticketId", issue.getTicketId());
            item.put("subject",  issue.getSubject());
            item.put("userName", issue.getUserName());
            item.put("status",   issue.getStatus());
            item.put("category", issue.getCategory());
            item.put("createdAt",issue.getCreatedAt());
            return item;
        }).collect(Collectors.toList());
    }

    private List<Map<String, Object>> buildRecentBookings() {
        return customerServiceRepo.findTop10ByOrderByCreatedAtDesc().stream().map(svc -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id",          svc.getId());
            item.put("userId",      svc.getUserId());
            item.put("vehicleType", svc.getVehicleType());
            item.put("brand",       svc.getBrand());
            item.put("model",       svc.getModel());
            item.put("status",      svc.getStatus());
            item.put("createdAt",   svc.getCreatedAt());
            return item;
        }).collect(Collectors.toList());
    }

    private List<Map<String, Object>> buildServiceRequestsOverTime() {
        // Group last 30 days bookings by date
        List<CustomerServiceModel> all = customerServiceRepo.findAll();
        Map<LocalDate, Long> byDate = all.stream()
            .filter(s -> s.getSelectedDate() != null && s.getSelectedDate().isAfter(LocalDate.now().minusDays(30)))
            .collect(Collectors.groupingBy(CustomerServiceModel::getSelectedDate, Collectors.counting()));

        List<Map<String, Object>> result = new ArrayList<>();
        for (int i = 29; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("date",     date.toString());
            point.put("requests", byDate.getOrDefault(date, 0L));
            result.add(point);
        }
        return result;
    }

    private List<Map<String, Object>> buildUserRolesDistribution() {
        long approvedServiceCenterCount = serviceCenterRepo.findByApprovalStatus(ApprovalStatus.APPROVED).size();
        long approvedFleetManagerCount  = fleetManagerRepo.findByApprovalStatus(ApprovalStatus.APPROVED).size();

        List<Map<String, Object>> result = new ArrayList<>();
        for (UserRoles role : UserRoles.values()) {
            if (role == UserRoles.ADMIN) continue;
            long roleCount = userRepository.countByRole(role);

            if (role == UserRoles.SERVICE_CENTER_OWNER) {
                roleCount = Math.max(roleCount, approvedServiceCenterCount);
            } else if (role == UserRoles.FLEET_MANAGER) {
                roleCount = Math.max(roleCount, approvedFleetManagerCount);
            }

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("name",  role.name().replace("_", " "));
            item.put("value", roleCount);
            result.add(item);
        }
        return result;
    }

    private List<Map<String, Object>> buildServiceTrendData() {
        List<CustomerServiceModel> all = customerServiceRepo.findAll();
        Map<String, Map<String, Long>> byWeek = new LinkedHashMap<>();

        all.stream()
            .filter(s -> s.getSelectedDate() != null && s.getSelectedDate().isAfter(LocalDate.now().minusDays(90)))
            .forEach(s -> {
                String weekLabel = "W" + s.getSelectedDate().getDayOfYear() / 7;
                byWeek.computeIfAbsent(weekLabel, k -> new LinkedHashMap<>());
                String status = s.getStatus() != null ? s.getStatus().toLowerCase() : "unknown";
                byWeek.get(weekLabel).merge(status, 1L, Long::sum);
            });

        return byWeek.entrySet().stream().map(e -> {
            Map<String, Object> pt = new LinkedHashMap<>(e.getValue());
            pt.put("week", e.getKey());
            return pt;
        }).collect(Collectors.toList());
    }

    // ═══════════════════════════════════════════════════════════════
    //  ISSUE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════

    public Map<String, Object> getIssues(String status, String category, String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<IssueModel> result;

        boolean hasStatus   = status   != null && !status.isBlank();
        boolean hasCategory = category != null && !category.isBlank();
        boolean hasSearch   = search   != null && !search.isBlank();

        if (hasSearch && hasStatus) {
            result = issueRepository.searchByStatusAndKeyword(status, search, pageable);
        } else if (hasSearch) {
            result = issueRepository.searchIssues(search, pageable);
        } else if (hasStatus && hasCategory) {
            result = issueRepository.findByStatusAndCategory(status, category, pageable);
        } else if (hasStatus) {
            result = issueRepository.findByStatus(status, pageable);
        } else if (hasCategory) {
            result = issueRepository.findByCategory(category, pageable);
        } else {
            result = issueRepository.findAll(pageable);
        }

        return Map.of(
            "data",  result.getContent(),
            "total", result.getTotalElements(),
            "pages", result.getTotalPages()
        );
    }

    public IssueModel getIssueById(String id) {
        return issueRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Issue not found: " + id));
    }

    public IssueModel replyToIssue(String id, String message, String adminName) {
        IssueModel issue = getIssueById(id);
        IssueModel.IssueReply reply = new IssueModel.IssueReply(
            "admin", adminName, message, LocalDateTime.now()
        );
        issue.getReplies().add(reply);
        if ("OPEN".equals(issue.getStatus())) {
            issue.setStatus("IN_PROGRESS");
        }
        return issueRepository.save(issue);
    }

    public IssueModel updateIssueStatus(String id, String status, String adminId) {
        IssueModel issue = getIssueById(id);
        issue.setStatus(status.toUpperCase());
        if ("RESOLVED".equals(status.toUpperCase())) {
            issue.setResolvedBy(adminId);
        }
        return issueRepository.save(issue);
    }

    public IssueModel createIssue(IssueModel issue) {
        long count = issueRepository.count();
        issue.setTicketId(String.format("TKT-%04d", count + 1));
        issue.setStatus("OPEN");
        issue.setCreatedAt(LocalDateTime.now());
        return issueRepository.save(issue);
    }

    // ═══════════════════════════════════════════════════════════════
    //  VERIFICATION MODULE
    // ═══════════════════════════════════════════════════════════════

    public Map<String, Object> getServiceCenterRequests(String status, String search, int page, int size) {
        List<ServiceCenterRegistration> all;

        if (status != null && !status.isBlank()) {
            try {
                all = serviceCenterRepo.findByApprovalStatus(ApprovalStatus.valueOf(status.toUpperCase()));
            } catch (IllegalArgumentException e) {
                all = serviceCenterRepo.findAll();
            }
        } else {
            all = serviceCenterRepo.findAll();
        }

        if (search != null && !search.isBlank()) {
            String q = search.toLowerCase();
            all = all.stream().filter(sc ->
                (sc.getCenterName() != null && sc.getCenterName().toLowerCase().contains(q)) ||
                (sc.getOwnerName()  != null && sc.getOwnerName().toLowerCase().contains(q))  ||
                (sc.getCity()       != null && sc.getCity().toLowerCase().contains(q))
            ).collect(Collectors.toList());
        }

        all.sort((a, b) -> {
            if (a.getCreatedAt() == null || b.getCreatedAt() == null) return 0;
            return b.getCreatedAt().compareTo(a.getCreatedAt());
        });

        int total = all.size();
        int from  = page * size;
        int to    = Math.min(from + size, total);
        List<ServiceCenterRegistration> pageData = from >= total ? List.of() : all.subList(from, to);

        return Map.of("data", pageData, "total", total, "pages", (int) Math.ceil((double) total / size));
    }

    public ServiceCenterRegistration getServiceCenterById(String id) {
        return serviceCenterRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Service center not found: " + id));
    }

    public ServiceCenterRegistration approveServiceCenter(String id, String adminRemarks) {
        ServiceCenterRegistration sc = getServiceCenterById(id);
        sc.setApprovalStatus(ApprovalStatus.APPROVED);
        sc.setAdminRemarks(adminRemarks);
        ServiceCenterRegistration saved = serviceCenterRepo.save(sc);
        try { emailService.sendApprovalEmail(sc.getEmail(), sc.getCenterName(), true, adminRemarks); } catch (Exception ignored) {}
        return saved;
    }

    public ServiceCenterRegistration rejectServiceCenter(String id, String reason) {
        ServiceCenterRegistration sc = getServiceCenterById(id);
        sc.setApprovalStatus(ApprovalStatus.REJECTED);
        sc.setAdminRemarks(reason);
        ServiceCenterRegistration saved = serviceCenterRepo.save(sc);
        try { emailService.sendApprovalEmail(sc.getEmail(), sc.getCenterName(), false, reason); } catch (Exception ignored) {}
        return saved;
    }

    public Map<String, Object> getFleetManagerRequests(String status, String search, String industry, int page, int size) {
        List<FleetManagerRegistration> all;

        if (status != null && !status.isBlank()) {
            try {
                all = fleetManagerRepo.findByApprovalStatus(ApprovalStatus.valueOf(status.toUpperCase()));
            } catch (IllegalArgumentException e) {
                all = fleetManagerRepo.findAll();
            }
        } else {
            all = fleetManagerRepo.findAll();
        }

        if (industry != null && !industry.isBlank()) {
            String q = industry.toLowerCase();
            all = all.stream().filter(fm -> fm.getIndustryType() != null && fm.getIndustryType().toLowerCase().contains(q)).collect(Collectors.toList());
        }

        if (search != null && !search.isBlank()) {
            String q = search.toLowerCase();
            all = all.stream().filter(fm ->
                (fm.getCompanyName()  != null && fm.getCompanyName().toLowerCase().contains(q)) ||
                (fm.getManagerName()  != null && fm.getManagerName().toLowerCase().contains(q)) ||
                (fm.getCity()         != null && fm.getCity().toLowerCase().contains(q))
            ).collect(Collectors.toList());
        }

        all.sort((a, b) -> {
            if (a.getCreatedAt() == null || b.getCreatedAt() == null) return 0;
            return b.getCreatedAt().compareTo(a.getCreatedAt());
        });

        int total = all.size();
        int from  = page * size;
        int to    = Math.min(from + size, total);
        List<FleetManagerRegistration> pageData = from >= total ? List.of() : all.subList(from, to);

        return Map.of("data", pageData, "total", total, "pages", (int) Math.ceil((double) total / size));
    }

    public FleetManagerRegistration getFleetManagerById(String id) {
        return fleetManagerRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Fleet manager not found: " + id));
    }

    public FleetManagerRegistration approveFleetManager(String id, String adminRemarks) {
        FleetManagerRegistration fm = getFleetManagerById(id);
        fm.setApprovalStatus(ApprovalStatus.APPROVED);
        fm.setAdminRemarks(adminRemarks);
        FleetManagerRegistration saved = fleetManagerRepo.save(fm);
        try { emailService.sendApprovalEmail(fm.getEmail(), fm.getCompanyName(), true, adminRemarks); } catch (Exception ignored) {}
        return saved;
    }

    public FleetManagerRegistration rejectFleetManager(String id, String reason) {
        FleetManagerRegistration fm = getFleetManagerById(id);
        fm.setApprovalStatus(ApprovalStatus.REJECTED);
        fm.setAdminRemarks(reason);
        FleetManagerRegistration saved = fleetManagerRepo.save(fm);
        try { emailService.sendApprovalEmail(fm.getEmail(), fm.getCompanyName(), false, reason); } catch (Exception ignored) {}
        return saved;
    }

    // ═══════════════════════════════════════════════════════════════
    //  USER MANAGEMENT
    // ═══════════════════════════════════════════════════════════════

    public Map<String, Object> getUsers(String role, String search, boolean activeOnly, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<UserModel> result;

        boolean hasRole   = role   != null && !role.isBlank() && !role.equalsIgnoreCase("ALL");
        boolean hasSearch = search != null && !search.isBlank();

        if (hasSearch && hasRole) {
            result = userRepository.searchByRoleAndKeyword(role.toUpperCase(), search, pageable);
        } else if (hasSearch) {
            result = userRepository.searchUsers(search, pageable);
        } else if (hasRole) {
            result = userRepository.findByRole(UserRoles.valueOf(role.toUpperCase()), pageable);
        } else if (activeOnly) {
            result = userRepository.findByActive(true, pageable);
        } else {
            result = userRepository.findAll(pageable);
        }

        // Strip password from response
        List<Map<String, Object>> safeUsers = result.getContent().stream()
            .map(this::sanitizeUser)
            .collect(Collectors.toList());

        return Map.of("data", safeUsers, "total", result.getTotalElements(), "pages", result.getTotalPages());
    }

    public Map<String, Object> getUserById(String id) {
        UserModel user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found: " + id));
        return sanitizeUser(user);
    }

    public Map<String, Object> deactivateUser(String id) {
        UserModel user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found: " + id));
        user.setActive(false);
        userRepository.save(user);
        return Map.of("success", true, "message", "User deactivated successfully");
    }

    public Map<String, Object> reactivateUser(String id) {
        UserModel user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found: " + id));
        user.setActive(true);
        userRepository.save(user);
        return Map.of("success", true, "message", "User reactivated successfully");
    }

    public Map<String, Object> deleteUser(String id) {
        if (!userRepository.existsById(id)) throw new RuntimeException("User not found: " + id);
        userRepository.deleteById(id);
        return Map.of("success", true, "message", "User deleted successfully");
    }

    // ═══════════════════════════════════════════════════════════════
    //  SERVICE CENTER DATA MODULE
    // ═══════════════════════════════════════════════════════════════

    public Map<String, Object> getAllServiceCenters(String status, String search, int page, int size) {
        return getServiceCenterRequests(status, search, page, size);
    }

    // ═══════════════════════════════════════════════════════════════
    //  FLEET MANAGER DATA MODULE
    // ═══════════════════════════════════════════════════════════════

    public Map<String, Object> getAllFleetManagers(String status, String search, String industry, int page, int size) {
        return getFleetManagerRequests(status, search, industry, page, size);
    }

    // ═══════════════════════════════════════════════════════════════
    //  WORKERS MODULE
    // ═══════════════════════════════════════════════════════════════

    public Map<String, Object> getWorkers(String search, Boolean active, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<UserModel> result;

        if (search != null && !search.isBlank()) {
            result = userRepository.searchByRoleAndKeyword("WORKER", search, pageable);
        } else {
            result = userRepository.findByRole(UserRoles.WORKER, pageable);
        }

        List<Map<String, Object>> safeWorkers = result.getContent().stream()
            .filter(w -> active == null || w.isActive() == active)
            .map(this::sanitizeUser)
            .collect(Collectors.toList());

        return Map.of("data", safeWorkers, "total", result.getTotalElements(), "pages", result.getTotalPages());
    }

    // ═══════════════════════════════════════════════════════════════
    //  ANALYTICS
    // ═══════════════════════════════════════════════════════════════

    public Map<String, Object> getAnalyticsOverview() {
        Map<String, Object> data = new LinkedHashMap<>();

        data.put("totalUsers",       userRepository.count());
        data.put("totalBookings",    customerServiceRepo.count());
        data.put("totalServiceCenters", serviceCenterRepo.count());
        data.put("totalFleetManagers",  fleetManagerRepo.count());
        data.put("activeUsers",      userRepository.countByActive(true));
        data.put("resolvedIssues",   issueRepository.countByStatus("RESOLVED"));

        // Services chart data (last 30 days)
        data.put("serviceRequestsChart",  buildServiceRequestsOverTime());
        data.put("userRolesDistribution", buildUserRolesDistribution());
        data.put("serviceTrendChart",     buildServiceTrendData());
        data.put("servicesByCenter",      buildServicesByCenter());

        return data;
    }

    private List<Map<String, Object>> buildServicesByCenter() {
        List<CustomerServiceModel> all = customerServiceRepo.findAll();
        Map<String, Long> byCenter = new LinkedHashMap<>();

        all.forEach(s -> {
            String center = s.getServiceLocation() != null ? s.getServiceLocation() : "Unknown";
            byCenter.merge(center, 1L, Long::sum);
        });

        return byCenter.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
            .limit(10)
            .map(e -> Map.<String, Object>of("name", e.getKey(), "services", e.getValue()))
            .collect(Collectors.toList());
    }

    // ═══════════════════════════════════════════════════════════════
    //  HELPERS
    // ═══════════════════════════════════════════════════════════════

    private Map<String, Object> sanitizeUser(UserModel user) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id",           user.getId());
        map.put("name",         user.getName());
        map.put("email",        user.getEmail());
        map.put("phone",        user.getPhone());
        map.put("role",         user.getRole() != null ? user.getRole().name() : null);
        map.put("active",       user.isActive());
        map.put("city",         user.getCity());
        map.put("state",        user.getState());
        map.put("area",         user.getArea());
        map.put("pinCode",      user.getPinCode());
        map.put("businessName", user.getBusinessName());
        map.put("companyName",  user.getCompanyName());
        map.put("licenseNumber",user.getLicenseNumber());
        return map;
    }
}
