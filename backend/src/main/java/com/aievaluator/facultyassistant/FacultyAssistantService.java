package com.aievaluator.facultyassistant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FacultyAssistantService {

    private static final Logger log = LoggerFactory.getLogger(FacultyAssistantService.class);

    public FacultyAssistantDto.LabGenerationResponse generateAutomatedLab(String problemIdea) {
        log.info("Generating automated faculty programming lab for idea: {}", problemIdea);

        return FacultyAssistantDto.LabGenerationResponse.builder()
                .title("Subarray Max Product Evaluation")
                .problemStatement("Given an integer array, find a contiguous non-empty subarray that has the largest product, and return the product.")
                .constraints("1 <= N <= 2 * 10^4\n-10 <= nums[i] <= 10")
                .difficulty("MEDIUM")
                .bloomsTaxonomyLevel("Analyze (Level 4)")
                .interviewRelevance("Frequently asked in technical rounds at Amazon, Microsoft, and Zoho.")
                .sampleInput("4\n2 3 -2 4")
                .sampleOutput("6")
                .publicTestCases(List.of(
                        new FacultyAssistantDto.TestCaseItem("4\n2 3 -2 4", "6", "Public Sample"),
                        new FacultyAssistantDto.TestCaseItem("3\n-2 0 -1", "0", "Public Sample")
                ))
                .hiddenTestCases(List.of(
                        new FacultyAssistantDto.TestCaseItem("2\n-2 3", "3", "Hidden Boundary"),
                        new FacultyAssistantDto.TestCaseItem("5\n-2 -3 4 -1 -5", "120", "Hidden Negative Product")
                ))
                .build();
    }

    public FacultyAssistantDto.EdgeCasesResponse generateEdgeCases(String problemStatement) {
        log.info("Generating AI edge test cases for faculty lab");

        return FacultyAssistantDto.EdgeCasesResponse.builder()
                .problemStatement(problemStatement != null ? problemStatement : "General Array Evaluation")
                .boundaryTestCases(List.of(new FacultyAssistantDto.TestCaseItem("1\n0", "0", "Single Element Zero Boundary")))
                .negativeValueTestCases(List.of(new FacultyAssistantDto.TestCaseItem("3\n-5 -10 -2", "-2", "All Negative Integers")))
                .largeScaleStressTestCases(List.of(new FacultyAssistantDto.TestCaseItem("10000\n[Sequence of 1s]", "10000", "Large Input Scale Test")))
                .emptyInputTestCases(List.of(new FacultyAssistantDto.TestCaseItem("0\n", "0", "Empty Array Input")))
                .build();
    }
}
