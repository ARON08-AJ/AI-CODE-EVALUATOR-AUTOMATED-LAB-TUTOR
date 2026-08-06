package com.aievaluator.submission;

import com.aievaluator.model.Language;
import com.aievaluator.model.SubmissionStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public class SubmissionDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RunCodeRequest {
        @NotNull(message = "Question ID is required")
        private Long questionId;

        @NotBlank(message = "Code content is required")
        private String code;

        @NotNull(message = "Language is required")
        private Language language;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubmitCodeRequest {
        @NotNull(message = "Question ID is required")
        private Long questionId;

        @NotBlank(message = "Code content is required")
        private String code;

        @NotNull(message = "Language is required")
        private Language language;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RunCodeResponse {
        private SubmissionStatus status;
        private String stdout;
        private String stderr;
        private long executionTimeMs;
        private long memoryUsedKb;
        private int passCount;
        private int totalTestCases;
        private String failedInput;
        private String failedExpectedOutput;
        private String failedActualOutput;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubmissionResponse {
        private Long id;
        private Long questionId;
        private String questionTitle;
        private Long labId;
        private String labTitle;
        private String studentName;
        private String studentEmail;
        private String code;
        private Language language;
        private SubmissionStatus status;
        private long executionTimeMs;
        private long memoryUsedKb;
        private int passCount;
        private int totalTestCases;
        private String stdout;
        private String stderr;
        private String analysis;
        private String hint1;
        private String hint2;
        private String hint3;
        private List<String> recommendedTopics;
        private LocalDateTime submittedAt;
    }
}
