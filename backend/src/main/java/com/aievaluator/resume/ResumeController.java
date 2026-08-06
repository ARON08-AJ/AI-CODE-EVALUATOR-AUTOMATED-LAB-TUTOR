package com.aievaluator.resume;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/resume")
@Tag(name = "AI Resume & Portfolio Analyzer", description = "ATS Compatibility Scoring & Missing Skills Detection APIs")
public class ResumeController {

    private final ResumeService resumeService;

    public ResumeController(ResumeService resumeService) {
        this.resumeService = resumeService;
    }

    @PostMapping("/analyze")
    @Operation(summary = "Evaluate ATS compatibility score and detect missing technical skills")
    public ResponseEntity<ResumeDto.ResumeResponse> analyzeResume(@RequestBody ResumeDto.ResumeRequest request) {
        return ResponseEntity.ok(resumeService.analyzeResume(request.getResumeText(), request.getTargetRole(), request.getGithubUsername()));
    }
}
