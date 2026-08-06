package com.aievaluator.interview;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class InterviewDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionRequest {
        private String topic; // e.g. "Data Structures", "Spring Boot", "System Design", "Behavioral"
        private String difficulty; // "BEGINNER", "INTERMEDIATE", "ADVANCED"
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionResponse {
        private String questionId;
        private String topic;
        private String difficulty;
        private String questionText;
        private List<String> keyConceptsExpected;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnswerEvaluationRequest {
        private String questionText;
        private String studentAnswer;
        private String topic;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnswerEvaluationResponse {
        private int technicalScore; // 0 - 100
        private int clarityScore; // 0 - 100
        private String feedback;
        private List<String> keyPointsCovered;
        private List<String> missingKeyPoints;
        private String sampleModelAnswer;
    }
}
