package com.aievaluator.adaptive;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/adaptive")
@Tag(name = "Module 2: AI Adaptive Question Generator", description = "Personalized Coding Questions Based on Weaknesses")
public class AdaptiveQuestionController {

    private final AdaptiveQuestionService adaptiveQuestionService;

    public AdaptiveQuestionController(AdaptiveQuestionService adaptiveQuestionService) {
        this.adaptiveQuestionService = adaptiveQuestionService;
    }

    @PostMapping("/generate")
    @Operation(summary = "Generate adaptive coding problem tailored to student weak areas")
    public ResponseEntity<AdaptiveQuestionDto.QuestionResponse> generateQuestion(
            @RequestParam(defaultValue = "Array Boundaries") String weakTopic,
            @RequestParam(defaultValue = "MEDIUM") String difficulty) {
        return ResponseEntity.ok(adaptiveQuestionService.generateAdaptiveQuestion(weakTopic, difficulty));
    }
}
