package com.aievaluator.dashboard;

import com.aievaluator.auth.User;
import com.aievaluator.lab.LabRepository;
import com.aievaluator.lab.QuestionRepository;
import com.aievaluator.model.SubmissionStatus;
import com.aievaluator.submission.Submission;
import com.aievaluator.submission.SubmissionDto;
import com.aievaluator.submission.SubmissionRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
@Tag(name = "Dashboard & Analytics", description = "Student and Faculty Dashboard Statistics APIs")
public class DashboardController {

    private static final Logger log = LoggerFactory.getLogger(DashboardController.class);

    private final LabRepository labRepository;
    private final QuestionRepository questionRepository;
    private final SubmissionRepository submissionRepository;

    public DashboardController(LabRepository labRepository,
                               QuestionRepository questionRepository,
                               SubmissionRepository submissionRepository) {
        this.labRepository = labRepository;
        this.questionRepository = questionRepository;
        this.submissionRepository = submissionRepository;
    }

    @GetMapping("/student")
    @Operation(summary = "Get Student Dashboard performance metrics")
    public ResponseEntity<?> getStudentDashboard(@AuthenticationPrincipal User currentUser) {
        log.info("Fetching student dashboard stats for user: {}", currentUser.getEmail());

        long totalLabs = labRepository.count();
        List<Submission> userSubmissions = submissionRepository.findByUserIdOrderBySubmittedAtDesc(currentUser.getId());
        long totalSubmissions = userSubmissions.size();

        long acceptedCount = userSubmissions.stream()
                .filter(s -> s.getStatus() == SubmissionStatus.ACCEPTED)
                .map(s -> s.getQuestion().getId())
                .distinct()
                .count();

        long failedCount = totalSubmissions - userSubmissions.stream()
                .filter(s -> s.getStatus() == SubmissionStatus.ACCEPTED)
                .count();

        double accuracy = totalSubmissions > 0
                ? (userSubmissions.stream().filter(s -> s.getStatus() == SubmissionStatus.ACCEPTED).count() * 100.0 / totalSubmissions)
                : 0.0;

        List<SubmissionDto.SubmissionResponse> recent = userSubmissions.stream()
                .limit(5)
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(
                DashboardDto.StudentDashboardStats.builder()
                        .totalAssignedLabs(totalLabs)
                        .completedLabs(acceptedCount)
                        .pendingLabs(Math.max(0, totalLabs - acceptedCount))
                        .accuracyRate(Math.round(accuracy * 10.0) / 10.0)
                        .totalSubmissions(totalSubmissions)
                        .acceptedCount(acceptedCount)
                        .failedCount(failedCount)
                        .recentSubmissions(recent)
                        .build()
        );
    }

    @GetMapping("/faculty")
    @Operation(summary = "Get Faculty Dashboard overview metrics")
    public ResponseEntity<?> getFacultyDashboard(@AuthenticationPrincipal User currentUser) {
        log.info("Fetching faculty dashboard stats for faculty user: {}", currentUser.getEmail());

        long totalLabs = labRepository.countByCreatedById(currentUser.getId());
        if (totalLabs == 0) {
            totalLabs = labRepository.count(); // fallback view all if no lab created by specific faculty yet
        }
        long totalQuestions = questionRepository.count();
        List<Submission> allSubmissions = submissionRepository.findAll();
        long totalSubmissions = allSubmissions.size();

        long acceptedCount = allSubmissions.stream()
                .filter(s -> s.getStatus() == SubmissionStatus.ACCEPTED)
                .count();

        double passRate = totalSubmissions > 0 ? (acceptedCount * 100.0 / totalSubmissions) : 0.0;

        Map<String, Long> statusBreakdown = new HashMap<>();
        for (SubmissionStatus status : SubmissionStatus.values()) {
            statusBreakdown.put(status.name(), allSubmissions.stream().filter(s -> s.getStatus() == status).count());
        }

        List<SubmissionDto.SubmissionResponse> recent = allSubmissions.stream()
                .sorted((a, b) -> b.getSubmittedAt().compareTo(a.getSubmittedAt()))
                .limit(10)
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(
                DashboardDto.FacultyDashboardStats.builder()
                        .totalLabsCreated(totalLabs)
                        .totalQuestionsCreated(totalQuestions)
                        .totalStudentSubmissions(totalSubmissions)
                        .overallPassRate(Math.round(passRate * 10.0) / 10.0)
                        .statusBreakdown(statusBreakdown)
                        .recentStudentSubmissions(recent)
                        .build()
        );
    }

    private SubmissionDto.SubmissionResponse mapToResponse(Submission s) {
        List<String> topics = s.getRecommendedTopics() != null && !s.getRecommendedTopics().isEmpty()
                ? Arrays.asList(s.getRecommendedTopics().split(","))
                : List.of();

        return SubmissionDto.SubmissionResponse.builder()
                .id(s.getId())
                .questionId(s.getQuestion().getId())
                .questionTitle(s.getQuestion().getTitle())
                .labId(s.getQuestion().getLab() != null ? s.getQuestion().getLab().getId() : null)
                .labTitle(s.getQuestion().getLab() != null ? s.getQuestion().getLab().getTitle() : null)
                .studentName(s.getUser().getFullName())
                .studentEmail(s.getUser().getEmail())
                .code(s.getCode())
                .language(s.getLanguage())
                .status(s.getStatus())
                .executionTimeMs(s.getExecutionTimeMs())
                .memoryUsedKb(s.getMemoryUsedKb())
                .passCount(s.getPassCount())
                .totalTestCases(s.getTotalTestCases())
                .stdout(s.getStdout())
                .stderr(s.getStderr())
                .analysis(s.getAnalysis())
                .hint1(s.getHint1())
                .hint2(s.getHint2())
                .hint3(s.getHint3())
                .recommendedTopics(topics)
                .submittedAt(s.getSubmittedAt())
                .build();
    }
}
