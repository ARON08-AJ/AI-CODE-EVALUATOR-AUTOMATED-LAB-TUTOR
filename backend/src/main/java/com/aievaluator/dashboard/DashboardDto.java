package com.aievaluator.dashboard;

import com.aievaluator.submission.SubmissionDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

public class DashboardDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentDashboardStats {
        private long totalAssignedLabs;
        private long completedLabs;
        private long pendingLabs;
        private double accuracyRate;
        private long totalSubmissions;
        private long acceptedCount;
        private long failedCount;
        private List<SubmissionDto.SubmissionResponse> recentSubmissions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FacultyDashboardStats {
        private long totalLabsCreated;
        private long totalQuestionsCreated;
        private long totalStudentSubmissions;
        private double overallPassRate;
        private Map<String, Long> statusBreakdown;
        private List<SubmissionDto.SubmissionResponse> recentStudentSubmissions;
    }
}
