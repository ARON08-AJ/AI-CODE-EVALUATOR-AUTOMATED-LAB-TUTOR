package com.aievaluator.learningpath;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/learning-path")
@Tag(name = "Module 1: AI Learning Path Generator", description = "Dynamic Personalized Learning Roadmaps & Time Estimates")
public class LearningPathController {

    private final LearningPathService learningPathService;

    public LearningPathController(LearningPathService learningPathService) {
        this.learningPathService = learningPathService;
    }

    @GetMapping("/generate")
    @Operation(summary = "Generate personalized AI study roadmap based on submission history")
    public ResponseEntity<LearningPathDto.RoadmapResponse> getPersonalizedPath() {
        return ResponseEntity.ok(learningPathService.generatePersonalizedRoadmap(1L));
    }
}
