package com.aievaluator.debugger;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/debugger")
@Tag(name = "Module 4: AI Debugger Replay", description = "Visual Step-by-Step Program Execution & Variable Timeline APIs")
public class DebuggerReplayController {

    private final DebuggerReplayService debuggerReplayService;

    public DebuggerReplayController(DebuggerReplayService debuggerReplayService) {
        this.debuggerReplayService = debuggerReplayService;
    }

    @GetMapping("/replay/{submissionId}")
    @Operation(summary = "Get visual step-by-step execution timeline for failed submission")
    public ResponseEntity<DebuggerReplayDto.ReplayResponse> getReplay(@PathVariable String submissionId) {
        return ResponseEntity.ok(debuggerReplayService.generateExecutionReplay(submissionId));
    }
}
