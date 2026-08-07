package com.aievaluator.revision;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/revision")
@Tag(name = "Module 12: AI Revision Notes Generator", description = "Topic Summary Notes, Key Formulas, Pitfalls, & Interview Checklist APIs")
public class RevisionNotesController {

    private final RevisionNotesService revisionNotesService;

    public RevisionNotesController(RevisionNotesService revisionNotesService) {
        this.revisionNotesService = revisionNotesService;
    }

    @GetMapping("/generate")
    @Operation(summary = "Generate concise AI revision notes for any programming topic")
    public ResponseEntity<RevisionNotesDto.NotesResponse> getNotes(@RequestParam(defaultValue = "Arrays & Two-Pointer Techniques") String topic) {
        return ResponseEntity.ok(revisionNotesService.generateRevisionNotes(topic));
    }
}
