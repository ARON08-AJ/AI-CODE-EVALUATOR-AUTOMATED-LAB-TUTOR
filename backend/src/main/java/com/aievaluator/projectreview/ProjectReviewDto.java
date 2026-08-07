package com.aievaluator.projectreview;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class ProjectReviewDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReviewRequest {
        private String repoUrl;
        private String projectTitle;
        private String techStack;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReviewResponse {
        private String projectTitle;
        private String repoUrl;
        private int overallProjectScore; // 0 - 100
        private int architectureScore; // 0 - 100
        private int codeQualityScore; // 0 - 100
        private int documentationScore; // 0 - 100
        private int interviewReadinessScore; // 0 - 100
        private List<String> detectedDesignPatterns;
        private List<String> securityAuditFindings;
        private List<String> folderStructureSuggestions;
        private List<String> readmeImprovementTips;
        private String projectSummaryVerdict;
    }
}
