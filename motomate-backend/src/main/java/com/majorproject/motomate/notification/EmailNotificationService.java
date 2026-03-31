package com.majorproject.motomate.notification;

import com.majorproject.motomate.model.FleetManagerRegistration;
import com.majorproject.motomate.model.ServiceCenterRegistration;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Handles all email notifications for the service center registration flow:
 *  1. Admin alert   – sent to admin when a new application is submitted
 *  2. Owner receipt – confirmation email sent to the applicant
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailNotificationService {

    private final JavaMailSender mailSender;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Value("${app.admin.name}")
    private String adminName;

    @Value("${app.mail.from}")
    private String senderEmail;

    // ─────────────────────────────────────────────────────────────────────────
    //  Admin notification
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Sends an HTML alert to the admin inbox notifying a new sign-up is pending approval.
     * Runs asynchronously so the HTTP response is not blocked.
     */
    @Async
    public void sendAdminNewApplicationAlert(ServiceCenterRegistration reg) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(senderEmail);
            helper.setTo(adminEmail);
            helper.setSubject("🔔 New Service Center Application – " + reg.getCenterName());
            helper.setText(buildAdminAlertHtml(reg), true);

            mailSender.send(message);
            log.info("Admin alert sent to {} for application id={}", adminEmail, reg.getId());

        } catch (MessagingException e) {
            log.error("Failed to send admin alert for application id={}", reg.getId(), e);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Owner confirmation
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Sends an HTML confirmation receipt to the service center owner.
     */
    @Async
    public void sendOwnerApplicationConfirmation(ServiceCenterRegistration reg) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(senderEmail);
            helper.setTo(reg.getEmail());
            helper.setSubject("✅ Application Received – MotoMate Service Center");
            helper.setText(buildOwnerConfirmationHtml(reg), true);

            mailSender.send(message);
            log.info("Owner confirmation sent to {} for application id={}", reg.getEmail(), reg.getId());

        } catch (MessagingException e) {
            log.error("Failed to send owner confirmation to {}", reg.getEmail(), e);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  HTML Templates
    // ─────────────────────────────────────────────────────────────────────────

    private String buildAdminAlertHtml(ServiceCenterRegistration reg) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; color: #333; }
                .card { background: #f9fafb; border-radius: 12px; padding: 24px; max-width: 600px; margin: auto; }
                h2 { color: #1d4ed8; }
                table { width: 100%%; border-collapse: collapse; margin-top: 16px; }
                td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
                td:first-child { font-weight: bold; color: #6b7280; width: 40%%; }
                .badge { background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: bold; }
                .btn { display: inline-block; margin-top: 20px; background: #1d4ed8; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; }
              </style>
            </head>
            <body>
              <div class="card">
                <h2>🔔 New Service Center Application</h2>
                <p>A new service center has submitted a registration request. Please review and approve or reject the application.</p>
                <table>
                  <tr><td>Owner Name</td><td>%s</td></tr>
                  <tr><td>Email</td><td>%s</td></tr>
                  <tr><td>Phone</td><td>%s</td></tr>
                  <tr><td>Center Name</td><td>%s</td></tr>
                  <tr><td>Center Type</td><td>%s</td></tr>
                  <tr><td>Location</td><td>%s, %s – %s</td></tr>
                  <tr><td>Services</td><td>%s</td></tr>
                  <tr><td>Vehicle Types</td><td>%s</td></tr>
                  <tr><td>GST Number</td><td>%s</td></tr>
                  <tr><td>PAN Number</td><td>%s</td></tr>
                  <tr><td>License No.</td><td>%s</td></tr>
                  <tr><td>Years in Business</td><td>%s</td></tr>
                  <tr><td>Total Bays</td><td>%s</td></tr>
                  <tr><td>Status</td><td><span class="badge">PENDING REVIEW</span></td></tr>
                  <tr><td>Application ID</td><td>%s</td></tr>
                </table>
                <p style="margin-top:20px; font-size:13px; color:#6b7280;">
                  Log in to the MotoMate Admin Dashboard to review documents and take action.
                </p>
              </div>
            </body>
            </html>
            """.formatted(
                reg.getOwnerName(),
                reg.getEmail(),
                reg.getPhone(),
                reg.getCenterName(),
                safe(reg.getCenterType()),
                reg.getCity(), reg.getState(), reg.getPincode(),
                String.join(", ", reg.getServices()),
                String.join(", ", reg.getVehicleTypes()),
                reg.getGstNumber(),
                reg.getPanNumber(),
                reg.getLicenseNumber(),
                safe(String.valueOf(reg.getYearsInBusiness())),
                safe(String.valueOf(reg.getTotalBays())),
                reg.getId()
        );
    }

    private String buildOwnerConfirmationHtml(ServiceCenterRegistration reg) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; color: #333; }
                .card { background: #f9fafb; border-radius: 12px; padding: 24px; max-width: 600px; margin: auto; }
                h2 { color: #16a34a; }
                .highlight { background: #dcfce7; border-left: 4px solid #16a34a; padding: 12px 16px; border-radius: 6px; margin: 16px 0; }
                p { font-size: 15px; line-height: 1.6; }
                .footer { font-size: 12px; color: #9ca3af; margin-top: 24px; }
              </style>
            </head>
            <body>
              <div class="card">
                <h2>✅ Application Received!</h2>
                <p>Hi <strong>%s</strong>,</p>
                <p>Thank you for registering <strong>%s</strong> on MotoMate. Your application has been successfully submitted and is currently under review.</p>
                <div class="highlight">
                  <strong>What happens next?</strong><br/>
                  Our team will verify your documents and business details. You will receive an email at <strong>%s</strong> within <strong>2–3 business days</strong> once your center is approved and live on the platform.
                </div>
                <p><strong>Application Reference ID:</strong> %s</p>
                <p>If you have any questions, please contact us at support@motomate.com.</p>
                <p>Regards,<br/><strong>The MotoMate Team</strong></p>
                <div class="footer">This is an automated message. Please do not reply to this email.</div>
              </div>
            </body>
            </html>
            """.formatted(
                reg.getOwnerName(),
                reg.getCenterName(),
                reg.getEmail(),
                reg.getId()
        );
    }

    private String safe(String value) {
        return (value == null || value.equals("null")) ? "N/A" : value;
    }
    
    // =========================================================================
    //  Fleet Manager – Admin notification
    // =========================================================================

    @Async
    public void sendAdminFleetManagerAlert(FleetManagerRegistration reg) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(senderEmail);
            helper.setTo(adminEmail);
            helper.setSubject("🚛 New Fleet Manager Application – " + reg.getCompanyName());
            helper.setText(buildAdminFleetAlertHtml(reg), true);

            mailSender.send(message);
            log.info("Admin fleet alert sent to {} for application id={}", adminEmail, reg.getId());

        } catch (MessagingException e) {
            log.error("Failed to send admin fleet alert for id={}", reg.getId(), e);
        }
    }

    // =========================================================================
    //  Fleet Manager – Owner confirmation
    // =========================================================================

    @Async
    public void sendFleetManagerConfirmation(FleetManagerRegistration reg) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(senderEmail);
            helper.setTo(reg.getEmail());
            helper.setSubject("✅ Fleet Account Application Received – MotoMate");
            helper.setText(buildFleetManagerConfirmationHtml(reg), true);

            mailSender.send(message);
            log.info("Fleet confirmation sent to {} for id={}", reg.getEmail(), reg.getId());

        } catch (MessagingException e) {
            log.error("Failed to send fleet confirmation to {}", reg.getEmail(), e);
        }
    }

    @Async
    public void sendApprovalEmail(String recipientEmail, String displayName, boolean approved, String remarks) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(senderEmail);
            helper.setTo(recipientEmail);
            helper.setSubject(approved
                ? "✅ Your MotoMate Application Has Been Approved"
                : "❌ Your MotoMate Application Has Been Rejected");
            helper.setText(buildApprovalHtml(displayName, approved, remarks), true);

            mailSender.send(message);
            log.info("Approval email sent to {} (approved={})", recipientEmail, approved);

        } catch (MessagingException e) {
            log.error("Failed to send approval email to {}", recipientEmail, e);
        }
    }

    private String buildApprovalHtml(String displayName, boolean approved, String remarks) {
        String statusText = approved ? "Approved" : "Rejected";
        String headerEmoji = approved ? "✅" : "❌";
        String actionText = approved
            ? "Congratulations! Your application has been approved and you can now access MotoMate services."
            : "We are sorry to inform you that your application has been rejected.";

        return String.format(
            "<!DOCTYPE html>" +
            "<html><head><style>" +
            "body { font-family: Arial, sans-serif; color: #333; }" +
            " .card { background: #f9fafb; border-radius: 12px; padding: 24px; max-width: 600px; margin: auto; }" +
            " h2 { color: #1d4ed8; }" +
            " .badge { display: inline-block; padding: 8px 14px; border-radius: 999px; font-weight: bold; background: %s; color: %s; }" +
            " .note { margin-top: 16px; padding: 16px; background: #f3f4f6; border-radius: 10px; font-size: 14px; }" +
            "</style></head><body><div class=\"card\">" +
            "<h2>%s Application %s</h2>" +
            "<p>Hi <strong>%s</strong>,</p>" +
            "<div class=\"badge\">%s</div>" +
            "<p style=\"margin-top:16px; font-size:15px; line-height:1.6;\">%s</p>" +
            "<div class=\"note\"><strong>Remarks:</strong> %s</div>" +
            "<p style=\"margin-top:20px; font-size:13px; color:#6b7280;\">If you have questions, please contact support@motomate.com.</p>" +
            "</div></body></html>",
            approved ? "#d1fae5" : "#fee2e2",
            approved ? "#065f46" : "#991b1b",
            headerEmoji,
            statusText,
            displayName,
            statusText,
            actionText,
            safe(remarks == null ? "No additional remarks provided." : remarks)
        );
    }

    // =========================================================================
    //  HTML Templates
    // =========================================================================

    private String buildAdminFleetAlertHtml(FleetManagerRegistration reg) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; color: #333; }
                .card { background: #f9fafb; border-radius: 12px; padding: 24px; max-width: 600px; margin: auto; }
                h2 { color: #16a34a; }
                table { width: 100%%; border-collapse: collapse; margin-top: 16px; }
                td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
                td:first-child { font-weight: bold; color: #6b7280; width: 40%%; }
                .badge { background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: bold; }
              </style>
            </head>
            <body>
              <div class="card">
                <h2>🚛 New Fleet Manager Application</h2>
                <p>A new fleet manager has submitted a registration request. Please review and approve or reject.</p>
                <table>
                  <tr><td>Manager Name</td><td>%s</td></tr>
                  <tr><td>Designation</td><td>%s</td></tr>
                  <tr><td>Email</td><td>%s</td></tr>
                  <tr><td>Phone</td><td>%s</td></tr>
                  <tr><td>Company Name</td><td>%s</td></tr>
                  <tr><td>Industry Type</td><td>%s</td></tr>
                  <tr><td>Location</td><td>%s, %s – %s</td></tr>
                  <tr><td>Total Vehicles</td><td>%s</td></tr>
                  <tr><td>Vehicle Categories</td><td>%s</td></tr>
                  <tr><td>Service Needs</td><td>%s</td></tr>
                  <tr><td>Primary Garage</td><td>%s</td></tr>
                  <tr><td>Preferred Service Time</td><td>%s</td></tr>
                  <tr><td>In-house Mechanic</td><td>%s</td></tr>
                  <tr><td>GST Number</td><td>%s</td></tr>
                  <tr><td>PAN Number</td><td>%s</td></tr>
                  <tr><td>CIN / LLPIN</td><td>%s</td></tr>
                  <tr><td>Status</td><td><span class="badge">PENDING REVIEW</span></td></tr>
                  <tr><td>Application ID</td><td>%s</td></tr>
                </table>
                <p style="margin-top:20px; font-size:13px; color:#6b7280;">
                  Log in to the MotoMate Admin Dashboard to review documents and take action.
                </p>
              </div>
            </body>
            </html>
            """.formatted(
                reg.getManagerName(),
                safe(reg.getDesignation()),
                reg.getEmail(),
                reg.getPhone(),
                reg.getCompanyName(),
                reg.getIndustryType(),
                reg.getCity(), reg.getState(), reg.getPincode(),
                reg.getTotalVehicles(),
                String.join(", ", reg.getVehicleCategories()),
                String.join(", ", reg.getServiceNeeds()),
                safe(reg.getPrimaryGarage()),
                safe(reg.getPreferredServiceTime()),
                reg.isHasDedicatedMechanic() ? "Yes" : "No",
                reg.getGstNumber(),
                reg.getPanNumber(),
                safe(reg.getCinNumber()),
                reg.getId()
        );
    }

    private String buildFleetManagerConfirmationHtml(FleetManagerRegistration reg) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; color: #333; }
                .card { background: #f9fafb; border-radius: 12px; padding: 24px; max-width: 600px; margin: auto; }
                h2 { color: #16a34a; }
                .highlight { background: #dcfce7; border-left: 4px solid #16a34a; padding: 12px 16px; border-radius: 6px; margin: 16px 0; }
                p { font-size: 15px; line-height: 1.6; }
                .footer { font-size: 12px; color: #9ca3af; margin-top: 24px; }
              </style>
            </head>
            <body>
              <div class="card">
                <h2>✅ Fleet Account Application Received!</h2>
                <p>Hi <strong>%s</strong>,</p>
                <p>Thank you for registering <strong>%s</strong> on MotoMate. Your fleet manager application has been successfully submitted and is under review.</p>
                <div class="highlight">
                  <strong>What happens next?</strong><br/>
                  Our compliance team will verify your documents and organization details. You will receive an email at <strong>%s</strong> within <strong>1–2 business days</strong> once your fleet account is activated on the platform.
                </div>
                <p><strong>Application Reference ID:</strong> %s</p>
                <p><strong>Company:</strong> %s &nbsp;|&nbsp; <strong>Industry:</strong> %s &nbsp;|&nbsp; <strong>Fleet Size:</strong> %s vehicles</p>
                <p>If you have any questions, please contact us at support@motomate.com.</p>
                <p>Regards,<br/><strong>The MotoMate Team</strong></p>
                <div class="footer">This is an automated message. Please do not reply to this email.</div>
              </div>
            </body>
            </html>
            """.formatted(
                reg.getManagerName(),
                reg.getCompanyName(),
                reg.getEmail(),
                reg.getId(),
                reg.getCompanyName(),
                reg.getIndustryType(),
                reg.getTotalVehicles()
        );
    }
}
