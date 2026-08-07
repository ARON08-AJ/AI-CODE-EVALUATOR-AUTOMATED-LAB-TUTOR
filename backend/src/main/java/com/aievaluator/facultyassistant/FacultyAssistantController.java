package com.aievaluator.facultyassistant;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/faculty-assistant")
@Tag(name = "Module 13 & 14: AI Faculty Assistant & Edge Case Generator", description = "Automated Lab Creation, Bloom's Taxonomy Level, & Edge Case Suite Generator APIs")
public class FacultyAssistantController {

    private final FacultyAssistantService facultyAssistantService;

    public FacultyAssistantController(FacultyAssistantService facultyAssistantService) {
        this.facultyAssistantService = facultyAssistantService;
    }

    @PostMapping("/generate-lab")
    @Operation(summary = "Automatically generate complete lab problem, sample I/O, test cases, and Bloom's level")
    public ResponseEntity<FacultyAssistantDto.LabGenerationResponse> generateLab(@RequestParam(defaultValue = "Subarray Product") String problemIdea) {
        return ResponseEntity.ok(facultyAssistantService.generateAutomatedLab(problemIdea));
    }

    @PostMapping("/generate-edge-cases")
    @Operation(summary = "Generate boundary, negative, empty, and stress test cases for faculty review")
    public ResponseEntity<FacultyAssistantDto.EdgeCasesResponse> generateEdgeCases(@RequestBody String problemStatement) {
        return ResponseEntity.ok(facultyAssistantService.generateEdgeCases(problemStatement));
    }
}
