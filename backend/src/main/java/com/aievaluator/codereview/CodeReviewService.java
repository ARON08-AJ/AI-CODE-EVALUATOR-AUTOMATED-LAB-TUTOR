package com.aievaluator.codereview;

import com.aievaluator.model.Language;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class CodeReviewService {

    private static final Logger log = LoggerFactory.getLogger(CodeReviewService.class);

    public CodeReviewDto.CodeReviewResponse analyzeCodeQuality(String code, Language language) {
        log.info("Analyzing code quality and complexity for language: {}", language);

        if (code == null || code.trim().isEmpty()) {
            return CodeReviewDto.CodeReviewResponse.builder()
                    .qualityScore(0)
                    .cyclomaticComplexity(1)
                    .timeComplexity("O(1)")
                    .spaceComplexity("O(1)")
                    .namingConventionIssues(List.of("Source code is empty"))
                    .bestPracticeSuggestions(List.of("Provide executable code logic for analysis"))
                    .securityAlerts(List.of())
                    .architecturalSummary("No code available to evaluate.")
                    .build();
        }

        // 1. Calculate Cyclomatic Complexity based on decision points
        int complexity = calculateCyclomaticComplexity(code);

        // 2. Identify Naming Convention & Style Issues
        List<String> namingIssues = findNamingIssues(code, language);

        // 3. Time & Space Complexity Analysis
        String timeComplexity = estimateTimeComplexity(code);
        String spaceComplexity = estimateSpaceComplexity(code);

        // 4. Best Practices & Security Audit
        List<String> bestPractices = findBestPracticeSuggestions(code, language, complexity);
        List<String> securityAlerts = auditSecurityRisks(code, language);

        // 5. Calculate Overall Quality Score (out of 100)
        int score = 100;
        score -= Math.max(0, (complexity - 5) * 4);
        score -= namingIssues.size() * 5;
        score -= securityAlerts.size() * 15;
        score = Math.max(25, Math.min(100, score));

        String summary = String.format(
                "Code demonstrates %s time complexity with a Cyclomatic Complexity score of %d. %s",
                timeComplexity, complexity,
                score >= 80 ? "Well-structured solution meeting clean code principles." : "Refactoring recommended to lower cognitive complexity and improve maintainability."
        );

        return CodeReviewDto.CodeReviewResponse.builder()
                .qualityScore(score)
                .cyclomaticComplexity(complexity)
                .timeComplexity(timeComplexity)
                .spaceComplexity(spaceComplexity)
                .namingConventionIssues(namingIssues)
                .bestPracticeSuggestions(bestPractices)
                .securityAlerts(securityAlerts)
                .architecturalSummary(summary)
                .build();
    }

    private int calculateCyclomaticComplexity(String code) {
        int complexity = 1;
        String[] keywords = {"if", "else if", "while", "for", "switch", "case", "&&", "||", "catch", "\\?"};

        for (String kw : keywords) {
            Pattern p = Pattern.compile("\\b" + Pattern.quote(kw) + "\\b|\\?\\?");
            Matcher m = p.matcher(code);
            while (m.find()) {
                complexity++;
            }
        }
        return complexity;
    }

    private List<String> findNamingIssues(String code, Language language) {
        List<String> issues = new ArrayList<>();

        // Check for single letter variables outside loop indexers (i, j, k, n, x, y, z allowed)
        Pattern singleCharVar = Pattern.compile("\\b(int|float|double|char|var|let)\\s+([a-whlmopqrstuvwA-Z])\\b");
        Matcher m = singleCharVar.matcher(code);
        if (m.find()) {
            issues.add("Use descriptive variable names instead of non-standard single-character identifiers like '" + m.group(2) + "'.");
        }

        // Check for uppercase variable declarations
        Pattern upperVar = Pattern.compile("\\b(int|float|double|String|var)\\s+([A-Z][a-zA-Z0-9_]+)\\b");
        Matcher m2 = upperVar.matcher(code);
        if (m2.find() && language != Language.PYTHON) {
            issues.add("Variable '" + m2.group(2) + "' uses PascalCase. Standard variables should use camelCase.");
        }

        if (issues.isEmpty()) {
            issues.add("No major naming convention violations detected.");
        }
        return issues;
    }

    private String estimateTimeComplexity(String code) {
        int nestedLoopCount = 0;
        String[] lines = code.split("\n");
        int currentDepth = 0;

        for (String line : lines) {
            if (line.contains("for") || line.contains("while")) {
                currentDepth++;
                if (currentDepth > nestedLoopCount) nestedLoopCount = currentDepth;
            }
            if (line.contains("}")) {
                if (currentDepth > 0) currentDepth--;
            }
        }

        if (nestedLoopCount >= 3) return "O(N^3)";
        if (nestedLoopCount == 2) return "O(N^2)";
        if (nestedLoopCount == 1) return "O(N)";
        if (code.contains("/ 2") || code.contains(">> 1") || code.contains("binarySearch")) return "O(log N)";
        return "O(1)";
    }

    private String estimateSpaceComplexity(String code) {
        if (code.contains("new int[") || code.contains("new ArrayList") || code.contains("vector<") || code.contains("list(")) {
            return "O(N)";
        }
        if (code.contains("new int[") && code.contains("][")) {
            return "O(N^2)";
        }
        return "O(1)";
    }

    private List<String> findBestPracticeSuggestions(String code, Language language, int complexity) {
        List<String> suggestions = new ArrayList<>();

        if (complexity > 7) {
            suggestions.add("High Cyclomatic Complexity (" + complexity + "). Consider decomposing large functions into smaller modular helper methods.");
        }

        if (language == Language.PYTHON && !code.contains("def ")) {
            suggestions.add("Encapsulate main logic inside a `main()` function with `if __name__ == '__main__':` entry point.");
        }

        if (language == Language.JAVA && code.contains("System.out.print") && code.contains("for")) {
            suggestions.add("Inside tight loops in Java, consider using `StringBuilder` or `BufferedWriter` for high-throughput I/O.");
        }

        if (language == Language.CPP && !code.contains("ios_base::sync_with_stdio(false)")) {
            suggestions.add("Add `ios_base::sync_with_stdio(false); cin.tie(NULL);` to untie C/C++ I/O streams for fast competitive execution.");
        }

        if (suggestions.isEmpty()) {
            suggestions.add("Code adheres well to core language best practices.");
        }
        return suggestions;
    }

    private List<String> auditSecurityRisks(String code, Language language) {
        List<String> alerts = new ArrayList<>();

        if (code.contains("gets(") || code.contains("strcpy(")) {
            alerts.add("Unsafe C string function detected (e.g. `gets` / `strcpy`). Replace with bounded functions like `fgets` / `strncpy` to prevent buffer overflow vulnerabilities.");
        }

        if (code.contains("eval(") || code.contains("exec(")) {
            alerts.add("Arbitrary code execution primitive (`eval` / `exec`) detected. Never execute untrusted string payloads dynamically.");
        }

        return alerts;
    }
}
