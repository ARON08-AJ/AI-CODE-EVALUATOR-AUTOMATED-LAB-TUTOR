package com.aievaluator.learningpath;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class LearningPathDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoadmapResponse {
        private List<String> weakAreas;
        private List<String> strongAreas;
        private List<RecommendedStep> recommendedLearningOrder;
        private int estimatedTotalHours;
        private String aiStrategySummary;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecommendedStep {
        private int stepNumber;
        private String topic;
        private String rationale;
        private int estimatedMinutes;
        private String samplePracticeQuestion;
    }
}
