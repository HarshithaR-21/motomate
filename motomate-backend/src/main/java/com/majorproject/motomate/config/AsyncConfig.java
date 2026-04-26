package com.majorproject.motomate.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.web.servlet.config.annotation.AsyncSupportConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Enables async support and configures the timeout for SSE streams.
 *
 * The default async timeout in Spring MVC is 10 seconds — far too short
 * for a persistent SSE connection. We raise it to 30 minutes to match
 * the SseEmitter timeout set in SseNotificationService.
 *
 * Replace (or merge with) the existing AsyncConfig.java in your project.
 */
@Configuration
@EnableAsync
public class AsyncConfig implements WebMvcConfigurer {

    /** 30 minutes in milliseconds — matches SseEmitter timeout */
    private static final long SSE_TIMEOUT_MS = 30 * 60 * 1000L;

    @Override
    public void configureAsyncSupport(AsyncSupportConfigurer configurer) {
        configurer.setDefaultTimeout(SSE_TIMEOUT_MS);
    }
}
