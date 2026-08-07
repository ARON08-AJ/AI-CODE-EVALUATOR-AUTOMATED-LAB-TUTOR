package com.aievaluator.viva;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/viva")
@Tag(name = "AI Viva Voce Defense", description = "Automated Oral Defense Viva Voce Questions & Code Comprehension APIs")
public class VivaController {

    private final VivaService vivaService;

    public VivaController(VivaService vivaService) {
        this.vivaService = vivaService;
    }

    @PostMapping("/generate")
    @Operation(summary = "Generate tailored viva voce defense questions based on submitted code")
    public ResponseEntity<VivaDto.VivaQuestionResponse> generateViva(@RequestBody VivaDto.VivaRequest request) {
        return ResponseEntity.ok(vivaService.generateVivaQuestions(request.getCode(), request.getProblemTitle()));
    }

    @PostMapping("/evaluate")
    @Operation(summary = "Evaluate oral defense answer for code logic comprehension")
    public ResponseEntity<VivaDto.VivaEvaluationResponse> evaluateViva(@RequestBody VivaDto.VivaEvaluationRequest request) {
        return ResponseEntity.ok(vivaService.evaluateVivaAnswer(request.getCode(), request.getVivaQuestion(), request.getStudentAnswer()));
    }
}
