package com.aievaluator.submission;

import com.aievaluator.ai.AIHintResponse;
import com.aievaluator.ai.AITutorService;
import com.aievaluator.auth.User;
import com.aievaluator.execution.ExecutionResult;
import com.aievaluator.execution.ExecutionService;
import com.aievaluator.lab.Question;
import com.aievaluator.lab.QuestionRepository;
import com.aievaluator.lab.TestCase;
import com.aievaluator.model.SubmissionStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/submissions")
@Tag(name = "Code Submission & Evaluation", description = "Code Execution against public/hidden test cases and AI Hint Generation APIs")
public class SubmissionController {

    private static final Logger log = LoggerFactory.getLogger(SubmissionController.class);

    private final QuestionRepository questionRepository;
    private final SubmissionRepository submissionRepository;
    private final ExecutionService executionService;
    private final AITutorService aiTutorService;

    public SubmissionController(QuestionRepository questionRepository,
                                SubmissionRepository submissionRepository,
                                ExecutionService executionService,
                                AITutorService aiTutorService) {
        this.questionRepository = questionRepository;
        this.submissionRepository = submissionRepository;
        this.executionService = executionService;
        this.aiTutorService = aiTutorService;
    }

    @PostMapping("/run")
    @Operation(summary = "Run code against sample public test cases (Without storing submission record)")
    public ResponseEntity<?> runCode(@Valid @RequestBody SubmissionDto.RunCodeRequest request) {
        log.info("Run code requested for Question ID: {}, Language: {}", request.getQuestionId(), request.getLanguage());

        Question question = questionRepository.findById(request.getQuestionId())
                .orElse(null);

        if (question == null) {
            return ResponseEntity.notFound().build();
        }

        // Only evaluate public test cases for sample runs
        List<TestCase> publicCases = question.getTestCases().stream()
                .filter(TestCase::isPublic)
                .collect(Collectors.toList());

        if (publicCases.isEmpty()) {
            // Fallback: build sample test case from Question fields if test cases array empty
            TestCase sample = TestCase.builder()
                    .input(question.getSampleInput())
                    .expectedOutput(question.getSampleOutput())
                    .isPublic(true)
                    .build();
            publicCases = List.of(sample);
        }

        ExecutionResult result = executionService.execute(
                request.getCode(),
                request.getLanguage(),
                publicCases,
                question.getTimeLimitMs(),
                question.getMemoryLimitMb()
        );

        log.info("Run code evaluation result: {} (Passed {}/{})", result.getStatus(), result.getPassCount(), result.getTotalTestCases());

        return ResponseEntity.ok(
                SubmissionDto.RunCodeResponse.builder()
                        .status(result.getStatus())
                        .stdout(result.getStdout())
                        .stderr(result.getStderr())
                        .executionTimeMs(result.getExecutionTimeMs())
                        .memoryUsedKb(result.getMemoryUsedKb())
                        .passCount(result.getPassCount())
                        .totalTestCases(result.getTotalTestCases())
                        .failedInput(result.getFailedInput())
                        .failedExpectedOutput(result.getFailedExpectedOutput())
                        .failedActualOutput(result.getFailedActualOutput())
                        .build()
        );
    }

    @PostMapping("/submit")
    @Operation(summary = "Submit code solution for complete public & hidden test case evaluation")
    public ResponseEntity<?> submitCode(@Valid @RequestBody SubmissionDto.SubmitCodeRequest request,
                                         @AuthenticationPrincipal User currentUser) {
        log.info("Code submission received from User: {} for Question ID: {}, Language: {}",
                currentUser.getEmail(), request.getQuestionId(), request.getLanguage());

        Question question = questionRepository.findById(request.getQuestionId())
                .orElse(null);

        if (question == null) {
            return ResponseEntity.notFound().build();
        }

        List<TestCase> allTestCases = question.getTestCases();
        if (allTestCases.isEmpty()) {
            TestCase sample = TestCase.builder()
                    .input(question.getSampleInput())
                    .expectedOutput(question.getSampleOutput())
                    .isPublic(true)
                    .build();
            allTestCases = List.of(sample);
        }

        ExecutionResult execResult = executionService.execute(
                request.getCode(),
                request.getLanguage(),
                allTestCases,
                question.getTimeLimitMs(),
                question.getMemoryLimitMb()
        );

        Submission submission = Submission.builder()
                .user(currentUser)
                .question(question)
                .code(request.getCode())
                .language(request.getLanguage())
                .status(execResult.getStatus())
                .executionTimeMs(execResult.getExecutionTimeMs())
                .memoryUsedKb(execResult.getMemoryUsedKb())
                .passCount(execResult.getPassCount())
                .totalTestCases(execResult.getTotalTestCases())
                .stdout(execResult.getStdout())
                .stderr(execResult.getStderr())
                .build();

        // Generate AI Hint automatically if submission is not ACCEPTED
        if (execResult.getStatus() != SubmissionStatus.ACCEPTED) {
            log.info("Submission failed status {}. Generating AI educational guidance.", execResult.getStatus());
            AIHintResponse hintResponse = aiTutorService.generateEducationalHint(
                    request.getCode(),
                    request.getLanguage(),
                    execResult.getStatus(),
                    execResult.getStderr(),
                    question.getProblemStatement(),
                    execResult.getFailedInput(),
                    execResult.getFailedExpectedOutput(),
                    execResult.getFailedActualOutput()
            );

            submission.setAnalysis(hintResponse.getAnalysis());
            submission.setHint1(hintResponse.getHint1());
            submission.setHint2(hintResponse.getHint2());
            submission.setHint3(hintResponse.getHint3());
            if (hintResponse.getRecommendedTopics() != null) {
                submission.setRecommendedTopics(String.join(",", hintResponse.getRecommendedTopics()));
            }
        }

        Submission saved = submissionRepository.save(submission);
        log.info("Submission saved successfully with ID: {}, Status: {}", saved.getId(), saved.getStatus());

        return ResponseEntity.status(HttpStatus.CREATED).body(mapToResponse(saved));
    }

    @GetMapping("/my-submissions")
    @Operation(summary = "Get submission history for current logged in student")
    public ResponseEntity<List<SubmissionDto.SubmissionResponse>> getMySubmissions(@AuthenticationPrincipal User currentUser) {
        log.info("Fetching submission history for student: {}", currentUser.getEmail());
        List<Submission> list = submissionRepository.findByUserIdOrderBySubmittedAtDesc(currentUser.getId());
        return ResponseEntity.ok(list.stream().map(this::mapToResponse).collect(Collectors.toList()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get submission details by ID")
    public ResponseEntity<?> getSubmissionById(@PathVariable Long id) {
        return submissionRepository.findById(id)
                .map(s -> ResponseEntity.ok(mapToResponse(s)))
                .orElseGet(() -> ResponseEntity.notFound().build());
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
