package com.aievaluator.debugger;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class DebuggerReplayService {

    private static final Logger log = LoggerFactory.getLogger(DebuggerReplayService.class);

    public DebuggerReplayDto.ReplayResponse generateExecutionReplay(String submissionId) {
        log.info("Generating step-by-step visual execution replay for submission: {}", submissionId);

        List<DebuggerReplayDto.ExecutionStep> timeline = List.of(
                DebuggerReplayDto.ExecutionStep.builder()
                        .stepNumber(1)
                        .iterationLabel("Iteration 1")
                        .variableState(Map.of("i", "0", "arr[i]", "4", "sum", "4"))
                        .conditionalEvaluation("arr[i] % 2 == 0 -> TRUE")
                        .status("NORMAL")
                        .build(),
                DebuggerReplayDto.ExecutionStep.builder()
                        .stepNumber(2)
                        .iterationLabel("Iteration 2")
                        .variableState(Map.of("i", "1", "arr[i]", "3", "sum", "4"))
                        .conditionalEvaluation("arr[i] % 2 == 0 -> FALSE")
                        .status("NORMAL")
                        .build(),
                DebuggerReplayDto.ExecutionStep.builder()
                        .stepNumber(3)
                        .iterationLabel("Iteration 3")
                        .variableState(Map.of("i", "2", "arr[i]", "[OUT OF BOUNDS]", "sum", "4"))
                        .conditionalEvaluation("i <= arr.length -> CRASH")
                        .status("CRASH")
                        .build()
        );

        return DebuggerReplayDto.ReplayResponse.builder()
                .submissionId(submissionId != null ? submissionId : "SUB-882")
                .language("PYTHON")
                .failureType("ArrayIndexOutOfBoundsException")
                .errorLineNumber(4)
                .executionTimeline(timeline)
                .aiDiagnosis("Program crashed on Iteration 3 at line 4 because index i (2) reached array bounds (length 2). Use 'i < len(arr)' instead of 'i <= len(arr)'.")
                .build();
    }
}
