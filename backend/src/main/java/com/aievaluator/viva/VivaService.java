package com.aievaluator.viva;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class VivaService {

    private static final Logger log = LoggerFactory.getLogger(VivaService.class);

    public VivaDto.VivaQuestionResponse generateVivaQuestions(String code, String problemTitle) {
        log.info("Generating viva voce defense questions for problem: {}", problemTitle);

        List<String> questions = new ArrayList<>();
        questions.add("Why did you choose this specific data structure or control flow for " + (problemTitle != null ? problemTitle : "this task") + "?");
        questions.add("What occurs if the input dataset is empty or negative? How does your code handle this boundary condition?");
        questions.add("Explain the step-by-step state changes of your primary loop during execution.");

        return VivaDto.VivaQuestionResponse.builder()
                .problemTitle(problemTitle != null ? problemTitle : "Programming Task")
                .vivaQuestions(questions)
                .focusArea("Logic Defense & Edge-Case Handling")
                .build();
    }

    public VivaDto.VivaEvaluationResponse evaluateVivaAnswer(String code, String vivaQuestion, String studentAnswer) {
        log.info("Evaluating oral viva answer for question: {}", vivaQuestion);

        if (studentAnswer == null || studentAnswer.trim().isEmpty()) {
            return VivaDto.VivaEvaluationResponse.builder()
                    .vivaScore(0)
                    .verdict("NEEDS_REVISION")
                    .feedback("No viva defense response submitted.")
                    .modelDefenseExplanation("Explain why your algorithm was selected and state its exact time complexity.")
                    .build();
        }

        int score = 85;
        if (studentAnswer.length() < 30) score -= 20;

        return VivaDto.VivaEvaluationResponse.builder()
                .vivaScore(score)
                .verdict(score >= 80 ? "CONCEPTUALLY_SOUND" : "PARTIAL_COMPREHENSION")
                .feedback("Good viva defense! You articulated the primary control loop and algorithm choice clearly.")
                .modelDefenseExplanation("The solution operates in O(N) time complexity by iterating through array elements sequentially.")
                .build();
    }
}
