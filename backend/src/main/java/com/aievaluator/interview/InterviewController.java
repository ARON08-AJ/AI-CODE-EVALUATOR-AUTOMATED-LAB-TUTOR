package com.aievaluator.interview;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/interview")
@Tag(name = "AI Mock Interviewer", description = "Technical & HR Mock Interview Questions & AI Evaluation APIs")
public class InterviewController {

    private final InterviewService interviewService;

    public InterviewController(InterviewService interviewService) {
        this.interviewService = interviewService;
    }

    @PostMapping("/generate")
    @Operation(summary = "Generate dynamic technical or HR interview question")
    public ResponseEntity<InterviewDto.QuestionResponse> generateQuestion(@RequestBody InterviewDto.QuestionRequest request) {
        return ResponseEntity.ok(interviewService.generateQuestion(request.getTopic(), request.getDifficulty()));
    }

    @PostMapping("/evaluate")
    @Operation(summary = "Evaluate student interview answer with AI technical & clarity scoring")
    public ResponseEntity<InterviewDto.AnswerEvaluationResponse> evaluateAnswer(@RequestBody InterviewDto.AnswerEvaluationRequest request) {
        return ResponseEntity.ok(interviewService.evaluateAnswer(request.getQuestionText(), request.getStudentAnswer(), request.getTopic()));
    }
}
