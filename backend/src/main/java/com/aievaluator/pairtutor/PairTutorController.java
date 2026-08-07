package com.aievaluator.pairtutor;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pair-tutor")
@Tag(name = "Module 8: AI Pair Programming Assistant", description = "Socratic Conversational Tutor for Non-Spoiler Conceptual Guidance")
public class PairTutorController {

    private final PairTutorService pairTutorService;

    public PairTutorController(PairTutorService pairTutorService) {
        this.pairTutorService = pairTutorService;
    }

    @PostMapping("/chat")
    @Operation(summary = "Ask Socratic AI Pair Programmer questions on concepts, debugging, and logic")
    public ResponseEntity<PairTutorDto.ChatResponse> chat(@RequestBody PairTutorDto.ChatRequest request) {
        return ResponseEntity.ok(pairTutorService.chatWithPairTutor(request.getStudentQuery(), request.getCodeContext(), request.getLanguage()));
    }
}
