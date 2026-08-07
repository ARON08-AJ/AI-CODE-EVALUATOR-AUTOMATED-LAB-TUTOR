package com.aievaluator.placement;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/placement")
@Tag(name = "Module 7: AI Placement Readiness Score", description = "Coding Score, Interview Readiness %, & Target Company Match (Zoho, TCS, Infosys, Cognizant, Hexaware)")
public class PlacementReadinessController {

    private final PlacementReadinessService placementReadinessService;

    public PlacementReadinessController(PlacementReadinessService placementReadinessService) {
        this.placementReadinessService = placementReadinessService;
    }

    @GetMapping("/readiness")
    @Operation(summary = "Calculate student placement readiness score and recommended target IT companies")
    public ResponseEntity<PlacementReadinessDto.ReadinessResponse> getReadiness() {
        return ResponseEntity.ok(placementReadinessService.calculatePlacementReadiness(1L));
    }
}
