package com.aievaluator.execution;

import com.aievaluator.model.SubmissionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecutionResult {
    private SubmissionStatus status;
    private String stdout;
    private String stderr;
    private long executionTimeMs;
    private long memoryUsedKb;
    private int passCount;
    private int totalTestCases;
    private String failedInput;
    private String failedExpectedOutput;
    private String failedActualOutput;
}
