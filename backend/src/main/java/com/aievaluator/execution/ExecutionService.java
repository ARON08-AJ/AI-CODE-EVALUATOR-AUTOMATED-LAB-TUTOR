package com.aievaluator.execution;

import com.aievaluator.lab.TestCase;
import com.aievaluator.model.Language;

import java.util.List;

public interface ExecutionService {
    ExecutionResult execute(String code, Language language, List<TestCase> testCases, int timeLimitMs, int memoryLimitMb);
}
