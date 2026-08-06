package com.aievaluator.resume;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class ResumeDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResumeRequest {
        private String resumeText;
        private String targetRole; // e.g. "Full Stack Developer", "Backend Engineer", "Data Scientist"
        private String githubUsername;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResumeResponse {
        private int atsScore; // 0 - 100
        private int portfolioScore; // 0 - 100
        private String targetRole;
        private List<String> matchedSkills;
        private List<String> missingSkills;
        private List<String> formatWarnings;
        private List<String> actionPlan;
        private String summary;
    }
}
