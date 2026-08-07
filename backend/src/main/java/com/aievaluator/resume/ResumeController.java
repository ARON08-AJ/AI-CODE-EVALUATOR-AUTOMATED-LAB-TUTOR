package com.aievaluator.resume;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/resume")
@Tag(name = "AI Resume & Portfolio Analyzer", description = "PDF Resume Upload, ATS Compatibility Scoring, & Missing Skills Detection APIs")
public class ResumeController {

    private final ResumeService resumeService;

    public ResumeController(ResumeService resumeService) {
        this.resumeService = resumeService;
    }

    @PostMapping("/analyze")
    @Operation(summary = "Evaluate ATS compatibility score from text payload")
    public ResponseEntity<ResumeDto.ResumeResponse> analyzeResume(@RequestBody ResumeDto.ResumeRequest request) {
        return ResponseEntity.ok(resumeService.analyzeResume(request.getResumeText(), request.getTargetRole(), request.getGithubUsername()));
    }

    @PostMapping(value = "/upload-pdf", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload PDF resume document (.pdf) for text extraction and ATS audit")
    public ResponseEntity<ResumeDto.ResumeResponse> uploadPdfResume(
            @RequestPart("file") MultipartFile file,
            @RequestParam(value = "targetRole", required = false, defaultValue = "Backend Engineer") String targetRole,
            @RequestParam(value = "githubUsername", required = false, defaultValue = "") String githubUsername) {
        return ResponseEntity.ok(resumeService.analyzePdfFile(file, targetRole, githubUsername));
    }
}
