package com.aievaluator.codereview;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/code-review")
@Tag(name = "AI Code Review", description = "Static Code Quality Analysis, Cyclomatic Complexity, & Naming Convention Audit APIs")
public class CodeReviewController {

    private final CodeReviewService codeReviewService;

    public CodeReviewController(CodeReviewService codeReviewService) {
        this.codeReviewService = codeReviewService;
    }

    @PostMapping("/analyze")
    @Operation(summary = "Analyze code quality, cyclomatic complexity, and style adherence")
    public ResponseEntity<CodeReviewDto.CodeReviewResponse> analyzeCode(@RequestBody CodeReviewDto.CodeReviewRequest request) {
        return ResponseEntity.ok(codeReviewService.analyzeCodeQuality(request.getCode(), request.getLanguage()));
    }
}
