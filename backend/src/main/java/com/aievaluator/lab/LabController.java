package com.aievaluator.lab;

import com.aievaluator.auth.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/labs")
@Tag(name = "Lab Management", description = "Faculty Lab & Coding Question Creation and Student Assignment Viewing APIs")
public class LabController {

    private static final Logger log = LoggerFactory.getLogger(LabController.class);

    private final LabRepository labRepository;
    private final QuestionRepository questionRepository;

    public LabController(LabRepository labRepository, QuestionRepository questionRepository) {
        this.labRepository = labRepository;
        this.questionRepository = questionRepository;
    }

    @GetMapping
    @Operation(summary = "Get all available programming labs")
    public ResponseEntity<List<Lab>> getAllLabs() {
        log.info("Fetching all programming labs");
        return ResponseEntity.ok(labRepository.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get lab details by ID")
    public ResponseEntity<?> getLabById(@PathVariable Long id) {
        log.info("Fetching lab details for lab ID: {}", id);
        return labRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @Operation(summary = "Create a new programming lab (Faculty only)")
    public ResponseEntity<?> createLab(@Valid @RequestBody LabDto.CreateLabRequest request,
                                       @AuthenticationPrincipal User currentUser) {
        log.info("Creating new lab: {} by user: {}", request.getTitle(), currentUser.getEmail());

        Lab lab = Lab.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .courseCode(request.getCourseCode())
                .deadline(request.getDeadline())
                .createdBy(currentUser)
                .build();

        if (request.getQuestions() != null) {
            for (LabDto.CreateQuestionRequest qReq : request.getQuestions()) {
                Question question = Question.builder()
                        .title(qReq.getTitle())
                        .problemStatement(qReq.getProblemStatement())
                        .sampleInput(qReq.getSampleInput())
                        .sampleOutput(qReq.getSampleOutput())
                        .allowedLanguages(qReq.getAllowedLanguages())
                        .timeLimitMs(qReq.getTimeLimitMs() > 0 ? qReq.getTimeLimitMs() : 2000)
                        .memoryLimitMb(qReq.getMemoryLimitMb() > 0 ? qReq.getMemoryLimitMb() : 256)
                        .lab(lab)
                        .build();

                if (qReq.getTestCases() != null) {
                    for (LabDto.CreateTestCaseRequest tcReq : qReq.getTestCases()) {
                        TestCase tc = TestCase.builder()
                                .input(tcReq.getInput())
                                .expectedOutput(tcReq.getExpectedOutput())
                                .isPublic(tcReq.isPublic())
                                .question(question)
                                .build();
                        question.getTestCases().add(tc);
                    }
                }
                lab.getQuestions().add(question);
            }
        }

        Lab savedLab = labRepository.save(lab);
        log.info("Lab created successfully with ID: {}", savedLab.getId());

        return ResponseEntity.status(HttpStatus.CREATED).body(savedLab);
    }

    @GetMapping("/questions/{questionId}")
    @Operation(summary = "Get coding question details by ID")
    public ResponseEntity<?> getQuestionById(@PathVariable Long questionId) {
        log.info("Fetching question details for ID: {}", questionId);
        return questionRepository.findById(questionId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
