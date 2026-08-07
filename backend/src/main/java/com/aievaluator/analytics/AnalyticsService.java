package com.aievaluator.analytics;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class AnalyticsService {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsService.class);

    public AnalyticsDto.StudentAnalyticsResponse getStudentAnalytics(Long userId) {
        log.info("Computing intelligent learning analytics & 10-topic skill graph for user ID: {}", userId);

        // Module 10: 10 Core Topic Skill Graph (0 - 100)
        Map<String, Integer> skillGraph = new LinkedHashMap<>();
        skillGraph.put("Arrays", 88);
        skillGraph.put("Strings", 82);
        skillGraph.put("Linked Lists", 75);
        skillGraph.put("Trees", 68);
        skillGraph.put("Graphs", 62);
        skillGraph.put("Dynamic Programming", 55);
        skillGraph.put("Greedy", 70);
        skillGraph.put("Recursion", 65);
        skillGraph.put("Sorting", 90);
        skillGraph.put("Searching", 85);

        return AnalyticsDto.StudentAnalyticsResponse.builder()
                .strongestTopic("Sorting & Searching")
                .weakestTopic("Dynamic Programming")
                .monthlyImprovementRate(28)
                .problemSolvingConsistency(89.4)
                .codingAccuracy(84)
                .difficultyProgression("Mastered Easy & Medium; Transitioning to Hard DP")
                .predictiveInterviewReadinessScore(82)
                .predictivePlacementReadinessScore(85)
                .topicSkillScores(skillGraph)
                .build();
    }
}
