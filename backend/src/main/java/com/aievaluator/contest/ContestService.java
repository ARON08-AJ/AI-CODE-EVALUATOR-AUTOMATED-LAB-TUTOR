package com.aievaluator.contest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ContestService {

    private static final Logger log = LoggerFactory.getLogger(ContestService.class);

    public ContestDto.ContestResponse getWeeklyContest() {
        log.info("Fetching active weekly coding contest and global leaderboard");

        List<ContestDto.LeaderboardEntry> leaderboard = List.of(
                ContestDto.LeaderboardEntry.builder().rank(1).studentName("Alex Student").score(300).totalTimeMs(1420).problemsSolved(3).build(),
                ContestDto.LeaderboardEntry.builder().rank(2).studentName("Jordan Coder").score(200).totalTimeMs(1890).problemsSolved(2).build(),
                ContestDto.LeaderboardEntry.builder().rank(3).studentName("Taylor Dev").score(100).totalTimeMs(950).problemsSolved(1).build()
        );

        return ContestDto.ContestResponse.builder()
                .id("CONTEST-2026-W32")
                .title("Weekly AI Placement Coding Challenge #32")
                .description("Compete in real-time competitive programming rounds with automated test case evaluation and AI complexity ranking.")
                .difficulty("MEDIUM-HARD")
                .startTime(LocalDateTime.now().minusHours(2))
                .endTime(LocalDateTime.now().plusHours(22))
                .totalParticipants(142)
                .leaderboard(leaderboard)
                .build();
    }
}
