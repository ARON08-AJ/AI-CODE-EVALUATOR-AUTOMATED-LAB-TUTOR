package com.aievaluator.aptitude;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class AptitudeDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuizQuestion {
        private String id;
        private String category; // "Quantitative", "Logical Reasoning", "Verbal"
        private String question;
        private List<String> options;
        private int correctOptionIndex;
        private String explanation;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmailReviewRequest {
        private String emailDraft;
        private String context; // e.g. "Requesting extension for lab assignment", "Follow up after interview"
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmailReviewResponse {
        private int professionalismScore; // 0 - 100
        private String toneVerdict;
        private List<String> grammarSuggestions;
        private String improvedDraft;
    }
}
