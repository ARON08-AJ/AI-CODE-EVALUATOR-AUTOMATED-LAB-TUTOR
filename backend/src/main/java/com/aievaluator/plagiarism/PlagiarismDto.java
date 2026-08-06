package com.aievaluator.plagiarism;

import com.aievaluator.model.Language;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public class PlagiarismDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CheckRequest {
        private String codeA;
        private String codeB;
        private Language language;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MatchResult {
        private String studentA;
        private String studentB;
        private double similarityScore; // 0 - 100%
        private String verdict; // LOW_RISK, SUSPICIOUS, HIGH_PLAGIARISM_RISK
        private double tokenSimilarity;
        private double structureSimilarity;
        private String explanation;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CohortScanResponse {
        private Long labId;
        private int totalSubmissionsAnalyzed;
        private int suspiciousPairCount;
        private List<MatchResult> topMatches;
        private LocalDateTime scannedAt;
    }
}
