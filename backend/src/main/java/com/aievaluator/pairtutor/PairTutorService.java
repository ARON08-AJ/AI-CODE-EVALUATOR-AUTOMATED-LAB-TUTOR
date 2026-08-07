package com.aievaluator.pairtutor;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class PairTutorService {

    private static final Logger log = LoggerFactory.getLogger(PairTutorService.class);

    @Value("${app.ai.groq-api-key:}")
    private String groqApiKey;

    @Value("${app.ai.model:llama-3.3-70b-versatile}")
    private String aiModel;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    public PairTutorDto.ChatResponse chatWithPairTutor(String studentQuery, String codeContext, String language) {
        log.info("Processing Pair Programming AI Chat query: {}", studentQuery);

        if (isGroqConfigured()) {
            try {
                return callGroqPairTutor(studentQuery, codeContext, language);
            } catch (Exception e) {
                log.warn("Groq API call failed for Pair Tutor: {}. Using pedagogical fallback.", e.getMessage());
            }
        }

        return fallbackPairTutor(studentQuery);
    }

    private PairTutorDto.ChatResponse callGroqPairTutor(String studentQuery, String codeContext, String language) throws Exception {
        String systemPrompt = """
                You are a Socratic AI Pair Programming Assistant in a Computer Science Laboratory.
                
                PEDAGOGICAL DIRECTIVES:
                1. NEVER GENERATE FULL ASSIGNMENT SOLUTIONS OR COPY-PASTEABLE CODE.
                2. Explain concepts clearly (e.g., recursion, binary search, array indexing).
                3. Ask leading Socratic questions encouraging active student debugging.
                4. Help students discover why their logic fails without doing the work for them.
                """;

        String userPrompt = String.format("Language: %s\nStudent Code Context:\n%s\nStudent Question:\n%s",
                language != null ? language : "General",
                codeContext != null ? codeContext : "N/A",
                studentQuery);

        String url = "https://api.groq.com/openai/v1/chat/completions";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        Map<String, Object> body = new HashMap<>();
        body.put("model", aiModel);
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
                String reply = (String) message.get("content");
                return PairTutorDto.ChatResponse.builder()
                        .aiReply(reply)
                        .leadingQuestion("What value does your loop index take on the final iteration before exiting?")
                        .suggestedAction("Inspect loop termination condition and trace with small input.")
                        .build();
            }
        }
        throw new RuntimeException("Empty response from Groq API");
    }

    private PairTutorDto.ChatResponse fallbackPairTutor(String query) {
        return PairTutorDto.ChatResponse.builder()
                .aiReply("Recursion works by solving smaller sub-problems until reaching a base case. Think of it like Russian nesting dolls! What base condition stops your function from calling itself infinitely?")
                .leadingQuestion("What is the simplest input where your function should return immediately without making a recursive call?")
                .suggestedAction("Write down your base case explicitly at the very top of your function.")
                .build();
    }

    private boolean isGroqConfigured() {
        return groqApiKey != null && !groqApiKey.trim().isEmpty() && !groqApiKey.startsWith("mock-");
    }
}
