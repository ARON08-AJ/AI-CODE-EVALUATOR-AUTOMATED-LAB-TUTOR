package com.aievaluator.analytics;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
@Tag(name = "Module 5 & 10: Learning Analytics & Skill Graph", description = "10-Topic Skill Radar, Monthly Improvement, & Placement Prediction APIs")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/student")
    @Operation(summary = "Get intelligent student learning analytics and 10-topic skill graph")
    public ResponseEntity<AnalyticsDto.StudentAnalyticsResponse> getAnalytics() {
        return ResponseEntity.ok(analyticsService.getStudentAnalytics(1L));
    }
}
