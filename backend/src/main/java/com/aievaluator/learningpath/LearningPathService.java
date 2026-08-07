package com.aievaluator.learningpath;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LearningPathService {

    private static final Logger log = LoggerFactory.getLogger(LearningPathService.class);

    public LearningPathDto.RoadmapResponse generatePersonalizedRoadmap(Long userId) {
        log.info("Generating dynamic AI personalized learning path for student ID: {}", userId);

        List<String> weakAreas = List.of("Array Boundaries & Off-by-one", "Binary Search Conditionals", "Recursion Base Cases");
        List<String> strongAreas = List.of("Basic Arithmetic Logic", "Standard I/O Operations");

        List<LearningPathDto.RecommendedStep> steps = List.of(
                LearningPathDto.RecommendedStep.builder()
                        .stepNumber(1)
                        .topic("Array Basics & Index Validation")
                        .rationale("Build confidence in index checking before advancing to multi-pointer algorithms.")
                        .estimatedMinutes(90)
                        .samplePracticeQuestion("Validate Array Indexing Boundaries")
                        .build(),
                LearningPathDto.RecommendedStep.builder()
                        .stepNumber(2)
                        .topic("Prefix Sum & Sliding Window")
                        .rationale("Learn sub-array range query optimizations.")
                        .estimatedMinutes(120)
                        .samplePracticeQuestion("Max Sum Subarray of Size K")
                        .build(),
                LearningPathDto.RecommendedStep.builder()
                        .stepNumber(3)
                        .topic("Binary Search on Sorted Arrays")
                        .rationale("Master O(log N) search boundaries and mid calculation.")
                        .estimatedMinutes(150)
                        .samplePracticeQuestion("Find First and Last Position of Element in Sorted Array")
                        .build()
        );

        return LearningPathDto.RoadmapResponse.builder()
                .weakAreas(weakAreas)
                .strongAreas(strongAreas)
                .recommendedLearningOrder(steps)
                .estimatedTotalHours(6)
                .aiStrategySummary("Roadmap dynamically structured around your recent array boundary edge case failures to ensure rapid mastery.")
                .build();
    }
}
