package com.aievaluator.contest;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public class ContestDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContestResponse {
        private String id;
        private String title;
        private String description;
        private String difficulty;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private int totalParticipants;
        private List<LeaderboardEntry> leaderboard;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LeaderboardEntry {
        private int rank;
        private String studentName;
        private int score;
        private long totalTimeMs;
        private int problemsSolved;
    }
}
