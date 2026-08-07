package com.aievaluator.codereview;

import com.aievaluator.model.Language;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class CodeReviewService {

    private static final Logger log = LoggerFactory.getLogger(CodeReviewService.class);

    @Value("${app.ai.groq-api-key:}")
    private String groqApiKey;

    @Value("${app.ai.model:llama-3.3-70b-versatile}")
    private String aiModel;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    public CodeReviewDto.CodeReviewResponse analyzeCodeQuality(String code, Language language) {
        log.info("Analyzing code quality and complexity with Groq LLM for language: {}", language);

        if (code == null || code.trim().isEmpty()) {
            return CodeReviewDto.CodeReviewResponse.builder()
                    .qualityScore(0)
                    .cyclomaticComplexity(1)
                    .timeComplexity("O(1)")
                    .spaceComplexity("O(1)")
                    .namingConventionIssues(List.of("Source code is empty"))
                    .bestPracticeSuggestions(List.of("Provide executable code logic for analysis"))
                    .securityAlerts(List.of())
                    .architecturalSummary("No code available to evaluate.")
                    .build();
        }

        if (isGroqConfigured()) {
            try {
                return callGroqCodeReview(code, language);
            } catch (Exception e) {
                log.warn("Groq API call failed for code review: {}. Falling back to static analyzer.", e.getMessage());
            }
        }

        return staticAnalyzeCodeQuality(code, language);
    }

    private CodeReviewDto.CodeReviewResponse callGroqCodeReview(String code, Language language) throws Exception {
        String systemPrompt = """
                You are a Senior Principal Software Architect and Static Code Analysis Engine.
                Your task is to conduct a hyper-rigorous, mathematically precise code quality and complexity audit.
                
                STRICT AUDIT INSTRUCTIONS:
                1. Calculate EXACT Cyclomatic Complexity score based on decision points (branches, loops, logical operators).
                2. Determine EXACT Time Complexity (O(1), O(log N), O(N), O(N log N), O(N^2), etc.) with exact mathematical reasoning.
                3. Determine Space Complexity.
                4. Audit naming conventions (camelCase for Java/C++, snake_case for Python, descriptive identifiers).
                5. Detect security vulnerabilities (unsafe memory functions, buffer overflow risks, eval/exec).
                6. Compute an overall Code Quality Score out of 100 based on clean code principles.
                
                ALWAYS respond in valid JSON matching this exact structure:
                {
                  "qualityScore": 88,
                  "cyclomaticComplexity": 3,
                  "timeComplexity": "O(N)",
                  "spaceComplexity": "O(1)",
                  "namingConventionIssues": ["Issue 1", "Issue 2"],
                  "bestPracticeSuggestions": ["Suggestion 1", "Suggestion 2"],
                  "securityAlerts": ["Alert 1"],
                  "architecturalSummary": "Precise architectural summary detailing trade-offs and structural quality."
                }
                """;

        String userPrompt = String.format("""
                Language: %s
                Source Code:
                ```
                %s
                ```
                Audit the code and output JSON matching the required schema.
                """, language, code);

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
                String content = (String) message.get("content");
                return objectMapper.readValue(content, CodeReviewDto.CodeReviewResponse.class);
            }
        }
        throw new RuntimeException("Empty response from Groq Code Review API");
    }

    private CodeReviewDto.CodeReviewResponse staticAnalyzeCodeQuality(String code, Language language) {
        int complexity = calculateCyclomaticComplexity(code);
        List<String> namingIssues = findNamingIssues(code, language);
        String timeComplexity = estimateTimeComplexity(code);
        String spaceComplexity = estimateSpaceComplexity(code);
        List<String> bestPractices = findBestPracticeSuggestions(code, language, complexity);
        List<String> securityAlerts = auditSecurityRisks(code, language);

        int score = 100;
        score -= Math.max(0, (complexity - 5) * 4);
        score -= namingIssues.size() * 5;
        score -= securityAlerts.size() * 15;
        score = Math.max(25, Math.min(100, score));

        String summary = String.format(
                "Code demonstrates %s time complexity with a Cyclomatic Complexity score of %d. %s",
                timeComplexity, complexity,
                score >= 80 ? "Well-structured solution meeting clean code principles." : "Refactoring recommended to lower cognitive complexity."
        );

        return CodeReviewDto.CodeReviewResponse.builder()
                .qualityScore(score)
                .cyclomaticComplexity(complexity)
                .timeComplexity(timeComplexity)
                .spaceComplexity(spaceComplexity)
                .namingConventionIssues(namingIssues)
                .bestPracticeSuggestions(bestPractices)
                .securityAlerts(securityAlerts)
                .architecturalSummary(summary)
                .build();
    }

    private int calculateCyclomaticComplexity(String code) {
        int complexity = 1;
        String[] keywords = {"if", "else if", "while", "for", "switch", "case", "&&", "||", "catch", "\\?"};
        for (String kw : keywords) {
            Pattern p = Pattern.compile("\\b" + Pattern.quote(kw) + "\\b|\\?\\?");
            Matcher m = p.matcher(code);
            while (m.find()) complexity++;
        }
        return complexity;
    }

    private List<String> findNamingIssues(String code, Language language) {
        List<String> issues = new ArrayList<>();
        Pattern singleCharVar = Pattern.compile("\\b(int|float|double|char|var|let)\\s+([a-whlmopqrstuvwA-Z])\\b");
        Matcher m = singleCharVar.matcher(code);
        if (m.find()) {
            issues.add("Use descriptive variable names instead of non-standard single-character identifiers like '" + m.group(2) + "'.");
        }
        if (issues.isEmpty()) issues.add("No major naming convention violations detected.");
        return issues;
    }

    private String estimateTimeComplexity(String code) {
        int nestedLoopCount = 0;
        String[] lines = code.split("\n");
        int currentDepth = 0;
        for (String line : lines) {
            if (line.contains("for") || line.contains("while")) {
                currentDepth++;
                if (currentDepth > nestedLoopCount) nestedLoopCount = currentDepth;
            }
            if (line.contains("}")) {
                if (currentDepth > 0) currentDepth--;
            }
        }
        if (nestedLoopCount >= 3) return "O(N^3)";
        if (nestedLoopCount == 2) return "O(N^2)";
        if (nestedLoopCount == 1) return "O(N)";
        return "O(1)";
    }

    private String estimateSpaceComplexity(String code) {
        if (code.contains("new int[") || code.contains("new ArrayList") || code.contains("vector<")) return "O(N)";
        return "O(1)";
    }

    private List<String> findBestPracticeSuggestions(String code, Language language, int complexity) {
        List<String> suggestions = new ArrayList<>();
        if (complexity > 7) suggestions.add("High Cyclomatic Complexity (" + complexity + "). Consider decomposing large functions into smaller modular helper methods.");
        if (suggestions.isEmpty()) suggestions.add("Code adheres well to core language best practices.");
        return suggestions;
    }

    private List<String> auditSecurityRisks(String code, Language language) {
        List<String> alerts = new ArrayList<>();
        if (code.contains("gets(") || code.contains("strcpy(")) {
            alerts.add("Unsafe C string function detected. Replace with bounded functions like fgets/strncpy.");
        }
        return alerts;
    }

    private boolean isGroqConfigured() {
        return groqApiKey != null && !groqApiKey.trim().isEmpty() && !groqApiKey.startsWith("mock-");
    }
}
