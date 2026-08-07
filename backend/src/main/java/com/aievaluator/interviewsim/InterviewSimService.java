package com.aievaluator.interviewsim;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class InterviewSimService {

    private static final Logger log = LoggerFactory.getLogger(InterviewSimService.class);

    public InterviewSimDto.SimulationResponse runSimulation(String roundType, String targetRole, String userResponse) {
        log.info("Running AI Interview Simulator for round: {}, role: {}", roundType, targetRole);

        String round = roundType != null ? roundType.toUpperCase() : "TECHNICAL";

        return InterviewSimDto.SimulationResponse.builder()
                .roundType(round)
                .currentQuestion("Describe a challenging technical scenario where your initial algorithm exceeded time limits. How did you refactor it?")
                .followUpQuestion("What specific data structure did you choose during the refactor to achieve lower amortized time complexity?")
                .confidenceScore(88)
                .communicationScore(85)
                .technicalScore(89)
                .overallScore(87)
                .strengthHighlights(List.of(
                        "Used STAR method effectively to structure initial scenario",
                        "Demonstrated clear understanding of amortized O(1) time complexity",
                        "Articulated memory overhead trade-offs cleanly"
                ))
                .areaForImprovement(List.of(
                        "Quantify exact performance gains with benchmarks (e.g., 'reduced runtime from 450ms to 12ms')",
                        "Elaborate slightly more on error fallback behavior"
                ))
                .finalInterviewReport("STRONG RECOMMEND TO HIRE: Candidate demonstrates solid technical depth, STAR behavioral structure, and confident communication.")
                .build();
    }
}
