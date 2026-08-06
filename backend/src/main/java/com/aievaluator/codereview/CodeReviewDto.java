package com.aievaluator.codereview;

import com.aievaluator.model.Language;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class CodeReviewDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CodeReviewRequest {
        private String code;
        private Language language;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CodeReviewResponse {
        private int qualityScore; // 0 - 100
        private int cyclomaticComplexity;
        private String timeComplexity;
        private String spaceComplexity;
        private List<String> namingConventionIssues;
        private List<String> bestPracticeSuggestions;
        private List<String> securityAlerts;
        private String architecturalSummary;
    }
}
