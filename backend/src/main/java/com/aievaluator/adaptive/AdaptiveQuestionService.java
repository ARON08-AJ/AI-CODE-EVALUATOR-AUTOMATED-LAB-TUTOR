package com.aievaluator.adaptive;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdaptiveQuestionService {

    private static final Logger log = LoggerFactory.getLogger(AdaptiveQuestionService.class);

    public AdaptiveQuestionDto.QuestionResponse generateAdaptiveQuestion(String weakTopic, String targetDifficulty) {
        log.info("Generating adaptive AI question for weak topic: {}, difficulty: {}", weakTopic, targetDifficulty);

        return AdaptiveQuestionDto.QuestionResponse.builder()
                .title("Adaptive Challenge: Boundary Sum of Non-Zero Elements")
                .difficulty(targetDifficulty != null ? targetDifficulty : "MEDIUM")
                .problemStatement("Given an array of integers, compute the sum of all elements strictly greater than zero that lie within valid non-negative array boundary ranges.")
                .sampleInput("5\n1 -2 3 4 -5")
                .sampleOutput("8")
                .publicTestCases(List.of(
                        new AdaptiveQuestionDto.TestCaseItem("5\n1 -2 3 4 -5", "8"),
                        new AdaptiveQuestionDto.TestCaseItem("3\n-1 -2 -3", "0")
                ))
                .hiddenTestCases(List.of(
                        new AdaptiveQuestionDto.TestCaseItem("1\n10", "10"),
                        new AdaptiveQuestionDto.TestCaseItem("4\n0 0 0 0", "0")
                ))
                .facultyHint("Encourage student to validate array indices explicitly before adding positive elements.")
                .targetWeakConcept(weakTopic != null ? weakTopic : "Array Boundaries")
                .build();
    }
}
