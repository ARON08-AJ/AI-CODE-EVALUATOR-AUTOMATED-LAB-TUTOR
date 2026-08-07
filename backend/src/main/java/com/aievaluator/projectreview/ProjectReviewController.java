package com.aievaluator.projectreview;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/project-review")
@Tag(name = "Module 18: AI Project Reviewer", description = "GitHub Repo & Portfolio Architecture, Code Quality, Security Audit, & Design Pattern Review APIs")
public class ProjectReviewController {

    private final ProjectReviewService projectReviewService;

    public ProjectReviewController(ProjectReviewService projectReviewService) {
        this.projectReviewService = projectReviewService;
    }

    @PostMapping("/analyze")
    @Operation(summary = "Audit full GitHub repository for folder structure, code quality, design patterns, and interview readiness")
    public ResponseEntity<ProjectReviewDto.ReviewResponse> analyze(@RequestBody ProjectReviewDto.ReviewRequest request) {
        return ResponseEntity.ok(projectReviewService.analyzeProject(request.getRepoUrl(), request.getProjectTitle(), request.getTechStack()));
    }
}
