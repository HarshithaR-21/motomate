package com.majorproject.motomate.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

/**
 * Handles file uploads for GST Certificate, Trade License, and Shop Photo.
 * Files are stored on the local filesystem under app.upload.dir.
 * Replace with S3/GCS in production.
 */
@Slf4j
@Service
public class FileUploadService {

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "application/pdf", "image/jpeg", "image/png"
    );
    private static final long MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

    @Value("${app.upload.dir}")
    private String uploadDir;

    /**
     * Validates and saves an uploaded file under a subfolder named by registrationId.
     *
     * @param file           the multipart file from the request
     * @param registrationId the MongoDB document ID used as folder name
     * @param docType        e.g. "gst-certificate", "trade-license", "shop-photo"
     * @return relative path where the file was saved
     */
    public String save(MultipartFile file, String registrationId, String docType) throws IOException {
        if (file == null || file.isEmpty()) {
            return null;
        }

        // Validate content type
        String contentType = file.getContentType();
        if (!ALLOWED_TYPES.contains(contentType)) {
            throw new IllegalArgumentException(
                "Unsupported file type: " + contentType + ". Only PDF, JPG and PNG are allowed."
            );
        }

        // Validate size
        if (file.getSize() > MAX_SIZE_BYTES) {
            throw new IllegalArgumentException("File size exceeds 5 MB limit.");
        }

        // Build destination path:  uploads/service-center-docs/<registrationId>/<docType>-<uuid>.ext
        String extension = getExtension(file.getOriginalFilename());
        String fileName = docType + "-" + UUID.randomUUID() + extension;

        Path directory = Paths.get(uploadDir, registrationId);
        Files.createDirectories(directory);

        Path destination = directory.resolve(fileName);
        Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

        String relativePath = Paths.get(registrationId, fileName).toString();
        log.info("Saved document [{}] → {}", docType, relativePath);
        return relativePath;
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf('.'));
    }
}
