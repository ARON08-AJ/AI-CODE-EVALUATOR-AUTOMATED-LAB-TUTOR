package com.aievaluator.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

public class AnalyticsDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentAnalyticsResponse {
        private String strongestTopic;
        private String weakestTopic;
        private int monthlyImprovementRate; // e.g. 24%
        private double problemSolvingConsistency; // e.g. 88.5%
        private int codingAccuracy; // e.g. 82%
        private String difficultyProgression; // e.g., "Transitioned from Easy to Medium"
        private int predictiveInterviewReadinessScore; // e.g. 84%
        private int predictivePlacementReadinessScore; // e.g. 82%
        private Map<String, Integer> topicSkillScores; // Module 10 Skill Graph: 10 topics (0-100)
    }
}
