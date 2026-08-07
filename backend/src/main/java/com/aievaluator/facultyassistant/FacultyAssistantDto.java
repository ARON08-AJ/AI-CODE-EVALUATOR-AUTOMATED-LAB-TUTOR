package com.aievaluator.facultyassistant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class FacultyAssistantDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LabGenerationResponse {
        private String title;
        private String problemStatement;
        private String constraints;
        private String difficulty; // EASY, MEDIUM, HARD
        private String bloomsTaxonomyLevel; // e.g. "Apply / Analyze"
        private String interviewRelevance;
        private String sampleInput;
        private String sampleOutput;
        private List<TestCaseItem> publicTestCases;
        private List<TestCaseItem> hiddenTestCases;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EdgeCasesResponse {
        private String problemStatement;
        private List<TestCaseItem> boundaryTestCases;
        private List<TestCaseItem> negativeValueTestCases;
        private List<TestCaseItem> largeScaleStressTestCases;
        private List<TestCaseItem> emptyInputTestCases;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TestCaseItem {
        private String input;
        private String expectedOutput;
        private String category;
    }
}
