package com.aievaluator.plagiarism;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/plagiarism")
@Tag(name = "AI Plagiarism & Similarity", description = "Abstract Syntax Tree & Tokenized Code Similarity Detection APIs")
public class PlagiarismController {

    private final PlagiarismService plagiarismService;

    public PlagiarismController(PlagiarismService plagiarismService) {
        this.plagiarismService = plagiarismService;
    }

    @PostMapping("/check")
    @Operation(summary = "Compare two code snippets for variable renaming and structural similarity")
    public ResponseEntity<PlagiarismDto.MatchResult> checkPair(@RequestBody PlagiarismDto.CheckRequest request) {
        return ResponseEntity.ok(plagiarismService.comparePair(
                request.getCodeA(), request.getCodeB(), request.getLanguage(), "Snippet A", "Snippet B"
        ));
    }

    @GetMapping("/cohort-scan/{labId}")
    @Operation(summary = "Scan entire lab cohort for suspicious similarity pairs (Faculty only)")
    public ResponseEntity<PlagiarismDto.CohortScanResponse> scanCohort(@PathVariable Long labId) {
        return ResponseEntity.ok(plagiarismService.scanLabCohort(labId));
    }
}
