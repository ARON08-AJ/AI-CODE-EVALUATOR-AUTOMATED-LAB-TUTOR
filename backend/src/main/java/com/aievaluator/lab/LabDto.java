package com.aievaluator.lab;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public class LabDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateTestCaseRequest {
        private String input;

        @NotBlank(message = "Expected output is required")
        private String expectedOutput;

        private boolean isPublic = true;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateQuestionRequest {
        @NotBlank(message = "Question title is required")
        private String title;

        @NotBlank(message = "Problem statement is required")
        private String problemStatement;

        private String sampleInput;
        private String sampleOutput;
        private String allowedLanguages = "C,CPP,JAVA,PYTHON";
        private int timeLimitMs = 2000;
        private int memoryLimitMb = 256;
        private List<CreateTestCaseRequest> testCases;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateLabRequest {
        @NotBlank(message = "Lab title is required")
        private String title;

        private String description;

        @NotBlank(message = "Course code is required")
        private String courseCode;

        private LocalDateTime deadline;
        private List<CreateQuestionRequest> questions;
    }
}
