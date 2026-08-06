package com.aievaluator.ai;

import com.aievaluator.model.Language;
import com.aievaluator.model.SubmissionStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class AITutorService {

    private static final Logger log = LoggerFactory.getLogger(AITutorService.class);

    @Value("${app.ai.groq-api-key:}")
    private String groqApiKey;

    @Value("${app.ai.openrouter-api-key:}")
    private String openRouterApiKey;

    @Value("${app.ai.model:llama-3.3-70b-versatile}")
    private String aiModel;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    public AIHintResponse generateEducationalHint(
            String code,
            Language language,
            SubmissionStatus status,
            String stderr,
            String problemStatement,
            String failedInput,
            String expectedOutput,
            String actualOutput) {

        log.info("Generating AI Educational Hint for submission with status: {} in language: {}", status, language);

        String systemPrompt = """
                You are an expert AI Programming Tutor designed for educational computer science laboratories.
                Your sole purpose is to help students learn debugging and understand programming concepts.
                
                STRICT PEDAGOGICAL RULES YOU MUST NEVER BREAK:
                1. DO NOT GENERATE SOURCE CODE. Never provide code snippets, completed functions, or copy-pasteable solutions.
                2. DO NOT REWRITE OR OPTIMIZE THE STUDENT'S CODE.
                3. DO NOT SOLVE THE ASSIGNMENT FOR THE STUDENT.
                4. DO NOT REVEAL HIDDEN TEST CASES OR SECRETS.
                5. ALWAYS respond in valid JSON matching this exact structure:
                {
                  "analysis": "Clear explanation of compiler or runtime error or output mismatch without revealing code",
                  "hint1": "High-level conceptual hint leading student toward the problem area",
                  "hint2": "Targeted debugging strategy or edge case to inspect",
                  "hint3": "Specific line or logic check hint encouraging active investigation",
                  "recommendedTopics": ["Topic 1", "Topic 2", "Topic 3"]
                }
                """;

        String userPrompt = String.format("""
                Language: %s
                Evaluation Status: %s
                Problem Description: %s
                Error / Stderr: %s
                Student Code:
                ```
                %s
                ```
                Failed Test Case Public Input: %s
                Expected Output: %s
                Actual Output Received: %s
                
                Analyze the mistake and generate educational hints in JSON format as required.
                """, language, status, problemStatement, stderr != null ? stderr : "None", code,
                failedInput != null ? failedInput : "N/A",
                expectedOutput != null ? expectedOutput : "N/A",
                actualOutput != null ? actualOutput : "N/A");

        if (isApiKeyConfigured(groqApiKey)) {
            try {
                return callGroqApi(systemPrompt, userPrompt);
            } catch (Exception e) {
                log.warn("Groq API call failed: {}. Utilizing intelligent educational tutor engine fallback.", e.getMessage());
            }
        }

        if (isApiKeyConfigured(openRouterApiKey)) {
            try {
                return callOpenRouterApi(systemPrompt, userPrompt);
            } catch (Exception e) {
                log.warn("OpenRouter API call failed: {}. Utilizing intelligent educational tutor engine fallback.", e.getMessage());
            }
        }

        // Educational Fallback Engine (when API keys are unconfigured or offline)
        return generateRuleBasedEducationalHint(code, language, status, stderr, problemStatement);
    }

    private AIHintResponse callGroqApi(String systemPrompt, String userPrompt) throws Exception {
        String url = "https://api.groq.com/openai/v1/chat/completions";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        Map<String, Object> body = new HashMap<>();
        body.put("model", aiModel);
        body.put("response_format", Map.of("type", "json_object"));

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));
        messages.add(Map.of("role", "user", "content", userPrompt));
        body.put("messages", messages);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            List choices = (List) response.getBody().get("choices");
            if (!choices.isEmpty()) {
                Map firstChoice = (Map) choices.get(0);
                Map message = (Map) firstChoice.get("message");
                String content = (String) message.get("content");
                return objectMapper.readValue(content, AIHintResponse.class);
            }
        }
        throw new RuntimeException("Empty response from Groq API");
    }

    private AIHintResponse callOpenRouterApi(String systemPrompt, String userPrompt) throws Exception {
        String url = "https://openrouter.ai/api/v1/chat/completions";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(openRouterApiKey);

        Map<String, Object> body = new HashMap<>();
        body.put("model", "meta-llama/llama-3-70b-instruct");

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));
        messages.add(Map.of("role", "user", "content", userPrompt));
        body.put("messages", messages);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            List choices = (List) response.getBody().get("choices");
            if (!choices.isEmpty()) {
                Map firstChoice = (Map) choices.get(0);
                Map message = (Map) firstChoice.get("message");
                String content = (String) message.get("content");
                return objectMapper.readValue(content, AIHintResponse.class);
            }
        }
        throw new RuntimeException("Empty response from OpenRouter API");
    }

    private AIHintResponse generateRuleBasedEducationalHint(String code, Language language, SubmissionStatus status, String stderr, String problemStatement) {
        log.info("Generating fallback educational feedback without revealing code solution");

        if (status == SubmissionStatus.COMPILATION_ERROR) {
            String errLower = stderr != null ? stderr.toLowerCase() : "";
            if (errLower.contains("semicolon") || errLower.contains("expected ';'")) {
                return AIHintResponse.builder()
                        .analysis("The compiler encountered a syntax error: missing semicolon terminator.")
                        .hint1("In " + language + ", statements must end with a semicolon `;`.")
                        .hint2("Review the lines flagged in the compiler output above and verify that variable assignments and function calls end cleanly.")
                        .hint3("Check if curly braces or statement ends are missing required punctuation.")
                        .recommendedTopics(List.of("Syntax Rules", "Statement Terminators", "Compiler Diagnostics"))
                        .build();
            } else if (errLower.contains("cannot find symbol") || errLower.contains("not declared")) {
                return AIHintResponse.builder()
                        .analysis("The program references an identifier (variable or method) that has not been declared in the current scope.")
                        .hint1("Ensure that all variables are declared before they are accessed.")
                        .hint2("Check for typographical capitalization errors in variable or function names.")
                        .hint3("Verify that required header files, packages, or imports are included at the top of your file.")
                        .recommendedTopics(List.of("Variable Scope", "Type Declarations", "Header & Import Statements"))
                        .build();
            } else {
                return AIHintResponse.builder()
                        .analysis("The compiler was unable to build your program due to syntax or type mismatch errors.")
                        .hint1("Read the compiler error log carefully to locate the exact line number.")
                        .hint2("Check matching parentheses, brackets, and quotes around line references.")
                        .hint3("Test compiling small sections of code incrementally to isolate syntax issues.")
                        .recommendedTopics(List.of("Compiler Error Messages", "Code Syntax", "Type Safety"))
                        .build();
            }
        } else if (status == SubmissionStatus.RUNTIME_ERROR) {
            String errLower = stderr != null ? stderr.toLowerCase() : "";
            if (errLower.contains("indexoutofbounds") || errLower.contains("indexerror") || errLower.contains("segmentation fault")) {
                return AIHintResponse.builder()
                        .analysis("A memory boundary exception occurred while attempting to access an array or list element out of range.")
                        .hint1("Check loop condition boundaries (`i < length` vs `i <= length`).")
                        .hint2("Verify array indexing when accessing elements near index 0 or index `size - 1`.")
                        .hint3("Print array length and current iteration index before the failing instruction.")
                        .recommendedTopics(List.of("Array Indexing", "Off-By-One Errors", "Boundary Conditions"))
                        .build();
            } else if (errLower.contains("zerodivisionerror") || errLower.contains("/ by zero")) {
                return AIHintResponse.builder()
                        .analysis("The program attempted a division or modulo operation by zero.")
                        .hint1("Check the denominator calculation prior to division.")
                        .hint2("Add an explicit guard clause (`if (denominator != 0)`) before dividing.")
                        .hint3("Trace your variable values when loop counts or initial values hit zero.")
                        .recommendedTopics(List.of("Arithmetic Safety", "Guard Clauses", "Edge Case Testing"))
                        .build();
            } else {
                return AIHintResponse.builder()
                        .analysis("Your program compiled successfully but crashed unexpectedly during execution.")
                        .hint1("Inspect input reading logic and ensure format specifiers match input types.")
                        .hint2("Verify null reference checking before dereferencing objects or pointers.")
                        .hint3("Add temporary print statements to track program execution progress right before crash.")
                        .recommendedTopics(List.of("Runtime Exceptions", "Input Handling", "Defensive Programming"))
                        .build();
            }
        } else if (status == SubmissionStatus.TIME_LIMIT_EXCEEDED) {
            return AIHintResponse.builder()
                    .analysis("The solution exceeded the allowed execution time limit.")
                    .hint1("Check loop termination variables to ensure infinite loops do not occur.")
                    .hint2("Analyze algorithm time complexity ($O(N^2)$ vs $O(N \\log N)$).")
                    .hint3("Avoid performing heavy redundant computations or repeated string concatenations inside inner loops.")
                    .recommendedTopics(List.of("Time Complexity", "Infinite Loop Guarding", "Algorithmic Efficiency"))
                    .build();
        } else {
            // WRONG_ANSWER
            return AIHintResponse.builder()
                    .analysis("Your code executed without errors, but the produced output does not match the expected test case output.")
                    .hint1("Pay close attention to exact spaces, newlines, and capitalization required in output formats.")
                    .hint2("Consider edge cases such as empty inputs, negative numbers, or boundary values.")
                    .hint3("Trace your algorithm step-by-step using pencil and paper for the sample input.")
                    .recommendedTopics(List.of("Output Formatting", "Edge Cases", "Algorithm Tracing"))
                    .build();
        }
    }

    private boolean isApiKeyConfigured(String key) {
        return key != null && !key.trim().isEmpty() && !key.startsWith("mock-");
    }
}
