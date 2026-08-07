package com.aievaluator.report;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/lab-report")
@Tag(name = "Module 15: AI Lab Report Generator", description = "Downloadable PDF Performance Report Generator APIs")
public class LabReportController {

    private final LabReportService labReportService;

    public LabReportController(LabReportService labReportService) {
        this.labReportService = labReportService;
    }

    @GetMapping("/download-pdf/{labId}")
    @Operation(summary = "Generate and download PDF lab completion report with stats, AI feedback, and learning path")
    public ResponseEntity<byte[]> downloadReport(@PathVariable Long labId) {
        return labReportService.generateLabReportPdf(labId, "student@lab.edu");
    }
}
