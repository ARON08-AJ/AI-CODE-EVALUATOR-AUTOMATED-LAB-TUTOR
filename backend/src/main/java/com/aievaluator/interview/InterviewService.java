package com.aievaluator.interview;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class InterviewService {

    private static final Logger log = LoggerFactory.getLogger(InterviewService.class);

    @Value("${app.ai.groq-api-key:}")
    private String groqApiKey;

    @Value("${app.ai.model:llama-3.3-70b-versatile}")
    private String aiModel;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    public InterviewDto.QuestionResponse generateQuestion(String topic, String difficulty) {
        log.info("Generating mock interview question with Groq LLM for topic: {}, difficulty: {}", topic, difficulty);

        if (isGroqConfigured()) {
            try {
                return callGroqQuestionGen(topic, difficulty);
            } catch (Exception e) {
                log.warn("Groq API question gen failed: {}. Using fallback bank.", e.getMessage());
            }
        }

        return fallbackQuestionGen(topic, difficulty);
    }

    public InterviewDto.AnswerEvaluationResponse evaluateAnswer(String questionText, String studentAnswer, String topic) {
        log.info("Evaluating interview answer with Groq LLM for topic: {}", topic);

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

        if (isGroqConfigured()) {
            try {
                return callGroqAnswerEval(questionText, studentAnswer, topic);
            } catch (Exception e) {
                log.warn("Groq API answer evaluation failed: {}. Using fallback evaluator.", e.getMessage());
            }
        }

        return fallbackAnswerEval(questionText, studentAnswer, topic);
    }

    private InterviewDto.QuestionResponse callGroqQuestionGen(String topic, String difficulty) throws Exception {
        String systemPrompt = """
                You are a Lead Technical Interviewer and Hiring Manager at a Fortune 500 Tech Company.
                Generate a precise, realistic technical or HR interview question for candidates.
                
                ALWAYS respond in valid JSON matching this exact structure:
                {
                  "questionId": "Q-101",
                  "topic": "Data Structures",
                  "difficulty": "INTERMEDIATE",
                  "questionText": "Clear, precise interview question text.",
                  "keyConceptsExpected": ["Concept 1", "Concept 2", "Concept 3"]
                }
                """;

        String userPrompt = String.format("Topic: %s\nTarget Difficulty Level: %s", topic, difficulty);

        String content = postGroq(systemPrompt, userPrompt);
        return objectMapper.readValue(content, InterviewDto.QuestionResponse.class);
    }

    private InterviewDto.AnswerEvaluationResponse callGroqAnswerEval(String questionText, String studentAnswer, String topic) throws Exception {
        String systemPrompt = """
                You are an Expert Hiring Committee Manager scoring candidate interview answers.
                Rigorously evaluate the candidate's technical correctness, architectural depth, and communication clarity.
                
                STRICT EVALUATION RULES:
                1. Score technical correctness out of 100 based on exact industry standards.
                2. Score clarity and communication out of 100 based on structure and precision (STAR method for behavioral).
                3. List exact key points covered vs missing key points.
                4. Provide a complete, comprehensive sample model answer.
                
                ALWAYS respond in valid JSON matching this exact structure:
                {
                  "technicalScore": 85,
                  "clarityScore": 90,
                  "feedback": "Detailed, highly actionable technical feedback.",
                  "keyPointsCovered": ["Point 1", "Point 2"],
                  "missingKeyPoints": ["Point 3"],
                  "sampleModelAnswer": "High-impact model answer demonstrating senior technical depth."
                }
                """;

        String userPrompt = String.format("Question: %s\nTopic: %s\nCandidate Answer:\n%s", questionText, topic, studentAnswer);

        String content = postGroq(systemPrompt, userPrompt);
        return objectMapper.readValue(content, InterviewDto.AnswerEvaluationResponse.class);
    }

    private String postGroq(String systemPrompt, String userPrompt) throws Exception {
        String url = "https://api.groq.com/openai/v1/chat/completions";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        Map<String, Object> body = new HashMap<>();
        body.put("model", aiModel);
        body.put("response_format", Map.of("type", "json_object"));
        body.put("messages", List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userPrompt)
        ));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            List choices = (List) response.getBody().get("choices");
            if (!choices.isEmpty()) {
                Map firstChoice = (Map) choices.get(0);
                Map message = (Map) firstChoice.get("message");
                return (String) message.get("content");
            }
        }
        throw new RuntimeException("Empty response from Groq API");
    }

    private InterviewDto.QuestionResponse fallbackQuestionGen(String topic, String difficulty) {
        return InterviewDto.QuestionResponse.builder()
                .questionId("DS-101")
                .topic(topic)
                .difficulty(difficulty)
                .questionText("Explain the difference between a Hash Table and a Binary Search Tree in terms of time complexity for search, insert, and delete operations.")
                .keyConceptsExpected(List.of("Hash collision handling", "Average O(1) vs O(log N)", "Tree balancing (AVL/Red-Black)"))
                .build();
    }

    private InterviewDto.AnswerEvaluationResponse fallbackAnswerEval(String questionText, String studentAnswer, String topic) {
        return InterviewDto.AnswerEvaluationResponse.builder()
                .technicalScore(82)
                .clarityScore(85)
                .feedback("Good technical effort. Emphasize performance trade-offs and edge cases for higher scores.")
                .keyPointsCovered(List.of("Core concepts and technical terms"))
                .missingKeyPoints(List.of("Time/Space complexity trade-offs"))
                .sampleModelAnswer("A complete answer defines the core primitive, compares time complexities, and illustrates with an implementation example.")
                .build();
    }

    private boolean isGroqConfigured() {
        return groqApiKey != null && !groqApiKey.trim().isEmpty() && !groqApiKey.startsWith("mock-");
    }
}
