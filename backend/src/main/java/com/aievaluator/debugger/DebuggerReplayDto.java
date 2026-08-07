package com.aievaluator.debugger;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

public class DebuggerReplayDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReplayResponse {
        private String submissionId;
        private String language;
        private String failureType; // e.g., "ArrayIndexOutOfBoundsException", "Wrong Answer Mismatch"
        private int errorLineNumber;
        private List<ExecutionStep> executionTimeline;
        private String aiDiagnosis;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExecutionStep {
        private int stepNumber;
        private String iterationLabel; // e.g. "Iteration 1"
        private Map<String, String> variableState; // e.g. {"i": "0", "total": "5"}
        private String conditionalEvaluation; // e.g. "x > 0 -> TRUE"
        private String status; // "NORMAL", "WARNING", "CRASH"
    }
}
