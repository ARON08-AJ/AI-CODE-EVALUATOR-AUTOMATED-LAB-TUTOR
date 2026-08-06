package com.aievaluator.aptitude;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/aptitude")
@Tag(name = "AI Aptitude & Soft Skills Coach", description = "Quantitative, Logical Reasoning, & Professional Communication Coach APIs")
public class AptitudeController {

    private final AptitudeService aptitudeService;

    public AptitudeController(AptitudeService aptitudeService) {
        this.aptitudeService = aptitudeService;
    }

    @GetMapping("/quiz")
    @Operation(summary = "Get practice quiz questions for Quantitative, Logical Reasoning, and Verbal Ability")
    public ResponseEntity<List<AptitudeDto.QuizQuestion>> getQuiz(@RequestParam(defaultValue = "Quantitative") String category) {
        return ResponseEntity.ok(aptitudeService.getPracticeQuestions(category));
    }

    @PostMapping("/email-review")
    @Operation(summary = "Analyze professional email draft for tone, grammar, and formal structure")
    public ResponseEntity<AptitudeDto.EmailReviewResponse> reviewEmail(@RequestBody AptitudeDto.EmailReviewRequest request) {
        return ResponseEntity.ok(aptitudeService.reviewEmail(request.getEmailDraft(), request.getContext()));
    }
}
