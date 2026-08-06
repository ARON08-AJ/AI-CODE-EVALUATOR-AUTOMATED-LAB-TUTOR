package com.aievaluator.interview;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class InterviewService {

    private static final Logger log = LoggerFactory.getLogger(InterviewService.class);

    private static final Map<String, List<InterviewDto.QuestionResponse>> QUESTION_BANK = Map.of(
            "Data Structures", List.of(
                    InterviewDto.QuestionResponse.builder()
                            .questionId("DS-101")
                            .topic("Data Structures")
                            .difficulty("INTERMEDIATE")
                            .questionText("Explain the difference between a Hash Table and a Binary Search Tree in terms of time complexity for search, insert, and delete operations.")
                            .keyConceptsExpected(List.of("Hash collision handling", "Average O(1) vs O(log N)", "Tree balancing (AVL/Red-Black)", "Sorted order traversal"))
                            .build()
            ),
            "Spring Boot", List.of(
                    InterviewDto.QuestionResponse.builder()
                            .questionId("SB-101")
                            .topic("Spring Boot")
                            .difficulty("INTERMEDIATE")
                            .questionText("How does Spring Boot handle Dependency Injection, and what is the difference between `@Component`, `@Service`, and `@Repository` annotations?")
                            .keyConceptsExpected(List.of("Inversion of Control (IoC)", "Bean lifecycle", "Stereotype annotations", "DataAccessException translation"))
                            .build()
            ),
            "Behavioral", List.of(
                    InterviewDto.QuestionResponse.builder()
                            .questionId("HR-101")
                            .topic("Behavioral")
                            .difficulty("BEGINNER")
                            .questionText("Describe a situation where a technical bug caused a delay in your project. How did you diagnose the issue and communicate with your team?")
                            .keyConceptsExpected(List.of("STAR Method (Situation, Task, Action, Result)", "Root cause debugging", "Proactive communication", "Preventative measures"))
                            .build()
            )
    );

    public InterviewDto.QuestionResponse generateQuestion(String topic, String difficulty) {
        log.info("Generating mock interview question for topic: {}, difficulty: {}", topic, difficulty);

        List<InterviewDto.QuestionResponse> list = QUESTION_BANK.getOrDefault(topic, QUESTION_BANK.get("Data Structures"));
        return list.get(new Random().nextInt(list.size()));
    }

    public InterviewDto.AnswerEvaluationResponse evaluateAnswer(String questionText, String studentAnswer, String topic) {
        log.info("Evaluating interview answer for topic: {}", topic);

        if (studentAnswer == null || studentAnswer.trim().isEmpty()) {
            return InterviewDto.AnswerEvaluationResponse.builder()
                    .technicalScore(0)
                    .clarityScore(0)
                    .feedback("No response provided. Answer technical questions using clear terminology and structured points.")
                    .keyPointsCovered(List.of())
                    .missingKeyPoints(List.of("Technical definitions", "Time/Space trade-offs", "Real-world examples"))
                    .sampleModelAnswer("A strong answer begins with high-level architecture before detailing performance trade-offs.")
                    .build();
        }

        String lower = studentAnswer.toLowerCase();

        List<String> covered = new ArrayList<>();
        List<String> missing = new ArrayList<>();

        if (lower.contains("hash") || lower.contains("o(1)") || lower.contains("key") || lower.contains("ioc") || lower.contains("star")) {
            covered.add("Core concepts and technical terms");
        } else {
            missing.add("Specific technical keywords and operational complexity");
        }

        if (studentAnswer.length() > 60) {
            covered.add("Detailed elaboration and structured explanation");
        } else {
            missing.add("Elaborate further with specific examples");
        }

        int techScore = Math.min(95, 60 + covered.size() * 18);
        int clarityScore = Math.min(95, 65 + (studentAnswer.length() > 80 ? 25 : 10));

        return InterviewDto.AnswerEvaluationResponse.builder()
                .technicalScore(techScore)
                .clarityScore(clarityScore)
                .feedback(techScore >= 80 ? "Excellent technical response with clear communication!" : "Good effort. Incorporate more quantitative metrics and architectural trade-offs.")
                .keyPointsCovered(covered)
                .missingKeyPoints(missing)
                .sampleModelAnswer("A complete answer defines the core primitive, compares time complexities, and illustrates with an implementation example.")
                .build();
    }
}
