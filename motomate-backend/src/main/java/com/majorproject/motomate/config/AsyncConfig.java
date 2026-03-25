package com.majorproject.motomate.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Enables @Async on Spring beans.
 * EmailNotificationService uses @Async so that sending emails
 * does not block the HTTP response to the client.
 */
@Configuration
@EnableAsync
public class AsyncConfig {
    // Spring's default SimpleAsyncTaskExecutor is sufficient here.
    // For production, configure a ThreadPoolTaskExecutor with proper pool sizes.
}
