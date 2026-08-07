package com.aievaluator.interviewsim;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class InterviewSimDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SimulationRequest {
        private String roundType; // HR, TECHNICAL, CODING, RESUME
        private String targetRole;
        private String userResponseText;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SimulationResponse {
        private String roundType;
        private String currentQuestion;
        private String followUpQuestion;
        private int confidenceScore; // 0 - 100
        private int communicationScore; // 0 - 100
        private int technicalScore; // 0 - 100
        private int overallScore; // 0 - 100
        private List<String> strengthHighlights;
        private List<String> areaForImprovement;
        private String finalInterviewReport;
    }
}
