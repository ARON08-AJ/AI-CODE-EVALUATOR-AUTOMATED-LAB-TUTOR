package com.aievaluator.interviewsim;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/interview-sim")
@Tag(name = "Module 17: AI Interview Simulator", description = "HR, Technical, Coding, & Resume Interview Rounds with Audio/Text Analysis & Confidence Scoring")
public class InterviewSimController {

    private final InterviewSimService interviewSimService;

    public InterviewSimController(InterviewSimService interviewSimService) {
        this.interviewSimService = interviewSimService;
    }

    @PostMapping("/simulate")
    @Operation(summary = "Simulate complete multi-round technical or HR interview with AI feedback report")
    public ResponseEntity<InterviewSimDto.SimulationResponse> simulate(@RequestBody InterviewSimDto.SimulationRequest request) {
        return ResponseEntity.ok(interviewSimService.runSimulation(request.getRoundType(), request.getTargetRole(), request.getUserResponseText()));
    }
}
