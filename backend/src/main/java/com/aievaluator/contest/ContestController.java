package com.aievaluator.contest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/contests")
@Tag(name = "AI Coding Contests", description = "Weekly Coding Challenges & Global Leaderboard APIs")
public class ContestController {

    private final ContestService contestService;

    public ContestController(ContestService contestService) {
        this.contestService = contestService;
    }

    @GetMapping("/active")
    @Operation(summary = "Get active weekly coding contest and participant leaderboard")
    public ResponseEntity<ContestDto.ContestResponse> getActiveContest() {
        return ResponseEntity.ok(contestService.getWeeklyContest());
    }
}
