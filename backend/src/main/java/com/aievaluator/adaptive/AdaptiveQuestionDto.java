package com.aievaluator.adaptive;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class AdaptiveQuestionDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionResponse {
        private String title;
        private String difficulty; // EASY, MEDIUM, HARD
        private String problemStatement;
        private String sampleInput;
        private String sampleOutput;
        private List<TestCaseItem> publicTestCases;
        private List<TestCaseItem> hiddenTestCases;
        private String facultyHint;
        private String targetWeakConcept;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TestCaseItem {
        private String input;
        private String expectedOutput;
    }
}
