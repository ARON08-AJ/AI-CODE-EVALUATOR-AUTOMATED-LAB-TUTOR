package com.aievaluator.placement;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PlacementReadinessService {

    private static final Logger log = LoggerFactory.getLogger(PlacementReadinessService.class);

    public PlacementReadinessDto.ReadinessResponse calculatePlacementReadiness(Long userId) {
        log.info("Calculating placement readiness score and company recommendations for user ID: {}", userId);

        List<String> targetCompanies = List.of("Zoho", "TCS", "Infosys", "Cognizant", "Hexaware");

        List<String> actionPlan = List.of(
                "Increase practice on Graph algorithms to qualify for Product Tier 1 coding rounds.",
                "Maintain current 88% problem-solving speed score in timed coding assessments.",
                "Review STAR behavioral interview techniques in the AI Mock Interviewer module."
        );

        return PlacementReadinessDto.ReadinessResponse.builder()
                .codingScore(84)
                .interviewReadiness(80)
                .averageVivaScore(86)
                .problemSolvingSpeedScore(88)
                .recommendedCompanies(targetCompanies)
                .readinessVerdict("READY FOR PLACEMENT - Qualified for Service & Product IT Hiring Drives")
                .actionPlanToReachTopTier(actionPlan)
                .build();
    }
}
