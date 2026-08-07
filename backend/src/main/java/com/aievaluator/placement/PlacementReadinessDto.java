package com.aievaluator.placement;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class PlacementReadinessDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReadinessResponse {
        private int codingScore; // e.g. 84%
        private int interviewReadiness; // e.g. 80%
        private int averageVivaScore; // e.g. 86%
        private int problemSolvingSpeedScore; // e.g. 88%
        private List<String> recommendedCompanies; // ["Zoho", "TCS", "Infosys", "Cognizant", "Hexaware"]
        private String readinessVerdict;
        private List<String> actionPlanToReachTopTier;
    }
}
