package com.aievaluator.aptitude;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AptitudeService {

    private static final Logger log = LoggerFactory.getLogger(AptitudeService.class);

    public List<AptitudeDto.QuizQuestion> getPracticeQuestions(String category) {
        log.info("Fetching practice quiz questions for category: {}", category);

        List<AptitudeDto.QuizQuestion> questions = new ArrayList<>();

        questions.add(AptitudeDto.QuizQuestion.builder()
                .id("QA-1")
                .category("Quantitative")
                .question("A car travels at 60 km/h for the first 2 hours and 90 km/h for the next 3 hours. What is the average speed of the car?")
                .options(List.of("72 km/h", "75 km/h", "78 km/h", "80 km/h"))
                .correctOptionIndex(2) // 78 km/h (Total Dist: 120 + 270 = 390. Total Time: 5h. 390/5 = 78)
                .explanation("Average speed = Total Distance / Total Time = (60*2 + 90*3) / (2 + 3) = 390 / 5 = 78 km/h.")
                .build());

        questions.add(AptitudeDto.QuizQuestion.builder()
                .id("LR-1")
                .category("Logical Reasoning")
                .question("If 'CODING' is coded as 'DPEJOH', how is 'TUTOR' coded?")
                .options(List.of("UVUPS", "UVPVS", "UVUPS", "UWVPS"))
                .correctOptionIndex(1) // UVPVS (+1 to each letter)
                .explanation("Each letter is shifted by +1 in the alphabet sequence (T->U, U->V, T->U, O->P, R->S => UVUPS / UVPVS).")
                .build());

        return questions;
    }

    public AptitudeDto.EmailReviewResponse reviewEmail(String emailDraft, String context) {
        log.info("Reviewing professional email draft for context: {}", context);

        int score = 85;
        List<String> suggestions = new ArrayList<>();
        String draftLower = emailDraft != null ? emailDraft.toLowerCase() : "";

        if (!draftLower.contains("dear") && !draftLower.contains("hello") && !draftLower.contains("respected")) {
            score -= 10;
            suggestions.add("Add a formal greeting (e.g., 'Dear Professor [Name]' or 'Hello [Hiring Manager]').");
        }

        if (!draftLower.contains("regards") && !draftLower.contains("sincerely")) {
            score -= 10;
            suggestions.add("Include a professional closing (e.g., 'Best regards, [Your Name]').");
        }

        String improved = String.format(
                "Dear Professor,\n\nI hope this email finds you well.\n\nI am writing regarding %s. %s\n\nThank you for your time and guidance.\n\nBest regards,\nStudent",
                context != null ? context : "my lab submission",
                emailDraft != null && !emailDraft.isBlank() ? emailDraft : "I would appreciate your feedback on my code evaluation."
        );

        return AptitudeDto.EmailReviewResponse.builder()
                .professionalismScore(Math.max(40, score))
                .toneVerdict(score >= 80 ? "Professional & Respectful" : "Needs Formal Formatting")
                .grammarSuggestions(suggestions.isEmpty() ? List.of("Email formatting adheres to professional standards.") : suggestions)
                .improvedDraft(improved)
                .build();
    }
}
