package com.aievaluator.plagiarism;

import com.aievaluator.model.Language;
import com.aievaluator.submission.Submission;
import com.aievaluator.submission.SubmissionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class PlagiarismService {

    private static final Logger log = LoggerFactory.getLogger(PlagiarismService.class);

    private final SubmissionRepository submissionRepository;

    public PlagiarismService(SubmissionRepository submissionRepository) {
        this.submissionRepository = submissionRepository;
    }

    public PlagiarismDto.MatchResult comparePair(String codeA, String codeB, Language language, String nameA, String nameB) {
        if (codeA == null || codeB == null || codeA.trim().isEmpty() || codeB.trim().isEmpty()) {
            return PlagiarismDto.MatchResult.builder()
                    .studentA(nameA)
                    .studentB(nameB)
                    .similarityScore(0.0)
                    .verdict("LOW_RISK")
                    .tokenSimilarity(0.0)
                    .structureSimilarity(0.0)
                    .explanation("Insufficient code content for comparison.")
                    .build();
        }

        // 1. Tokenized Jaccard Similarity (variable renaming invariant)
        Set<String> tokensA = tokenize(codeA);
        Set<String> tokensB = tokenize(codeB);
        double tokenSim = calculateJaccardSimilarity(tokensA, tokensB) * 100.0;

        // 2. Structural AST Representation Similarity (Control Flow structure invariant)
        String structA = extractStructuralSkeleton(codeA);
        String structB = extractStructuralSkeleton(codeB);
        double structSim = calculateLevenshteinSimilarity(structA, structB) * 100.0;

        // Combined Score
        double finalScore = Math.round((0.5 * tokenSim + 0.5 * structSim) * 10.0) / 10.0;

        String verdict;
        String explanation;
        if (finalScore >= 75.0) {
            verdict = "HIGH_PLAGIARISM_RISK";
            explanation = "High structural and token overlap detected. Code logic and flow match closely despite potential variable renaming.";
        } else if (finalScore >= 45.0) {
            verdict = "SUSPICIOUS";
            explanation = "Moderate structural similarity found. Review logic branches for manual verification.";
        } else {
            verdict = "LOW_RISK";
            explanation = "Independent implementations with low structural overlap.";
        }

        return PlagiarismDto.MatchResult.builder()
                .studentA(nameA)
                .studentB(nameB)
                .similarityScore(finalScore)
                .verdict(verdict)
                .tokenSimilarity(Math.round(tokenSim * 10.0) / 10.0)
                .structureSimilarity(Math.round(structSim * 10.0) / 10.0)
                .explanation(explanation)
                .build();
    }

    public PlagiarismDto.CohortScanResponse scanLabCohort(Long labId) {
        log.info("Scanning lab cohort for plagiarism. Lab ID: {}", labId);

        List<Submission> submissions = submissionRepository.findByQuestionLabIdOrderBySubmittedAtDesc(labId);
        if (submissions.isEmpty()) {
            submissions = submissionRepository.findAll(); // fallback to all submissions if lab filter empty
        }

        List<PlagiarismDto.MatchResult> matches = new ArrayList<>();
        int suspiciousCount = 0;

        for (int i = 0; i < submissions.size(); i++) {
            for (int j = i + 1; j < submissions.size(); j++) {
                Submission s1 = submissions.get(i);
                Submission s2 = submissions.get(j);

                // Skip comparing same user's submissions
                if (s1.getUser().getId().equals(s2.getUser().getId())) continue;

                PlagiarismDto.MatchResult res = comparePair(
                        s1.getCode(), s2.getCode(), s1.getLanguage(),
                        s1.getUser().getFullName() + " (" + s1.getUser().getEmail() + ")",
                        s2.getUser().getFullName() + " (" + s2.getUser().getEmail() + ")"
                );

                if (res.getSimilarityScore() >= 40.0) {
                    matches.add(res);
                    if (!res.getVerdict().equals("LOW_RISK")) suspiciousCount++;
                }
            }
        }

        matches.sort((a, b) -> Double.compare(b.getSimilarityScore(), a.getSimilarityScore()));

        return PlagiarismDto.CohortScanResponse.builder()
                .labId(labId)
                .totalSubmissionsAnalyzed(submissions.size())
                .suspiciousPairCount(suspiciousCount)
                .topMatches(matches)
                .scannedAt(LocalDateTime.now())
                .build();
    }

    private Set<String> tokenize(String code) {
        // Strip comments and normalize variable tokens
        String cleaned = code.replaceAll("//.*|/\\*.*?\\*/", "")
                .replaceAll("\"[^\"]*\"", "\"STR\"")
                .replaceAll("'[^']+'", "'C'")
                .replaceAll("\\b[a-zA-Z_][a-zA-Z0-9_]*\\b", "VAR");
        return new HashSet<>(Arrays.asList(cleaned.split("\\s+")));
    }

    private String extractStructuralSkeleton(String code) {
        StringBuilder sb = new StringBuilder();
        String[] keywords = {"if", "else", "for", "while", "return", "int", "float", "def", "public", "class"};
        for (String word : code.split("\\s+")) {
            for (String kw : keywords) {
                if (word.contains(kw)) {
                    sb.append(kw).append(";");
                    break;
                }
            }
        }
        return sb.toString();
    }

    private double calculateJaccardSimilarity(Set<String> setA, Set<String> setB) {
        if (setA.isEmpty() || setB.isEmpty()) return 0.0;
        Set<String> intersection = new HashSet<>(setA);
        intersection.retainAll(setB);
        Set<String> union = new HashSet<>(setA);
        union.addAll(setB);
        return (double) intersection.size() / union.size();
    }

    private double calculateLevenshteinSimilarity(String s1, String s2) {
        if (s1.isEmpty() && s2.isEmpty()) return 1.0;
        if (s1.isEmpty() || s2.isEmpty()) return 0.0;
        int distance = computeLevenshteinDistance(s1, s2);
        int maxLen = Math.max(s1.length(), s2.length());
        return 1.0 - ((double) distance / maxLen);
    }

    private int computeLevenshteinDistance(String lhs, String rhs) {
        int len0 = lhs.length() + 1;
        int len1 = rhs.length() + 1;
        int[] cost = new int[len0];
        int[] newcost = new int[len0];

        for (int i = 0; i < len0; i++) cost[i] = i;

        for (int j = 1; j < len1; j++) {
            newcost[0] = j;
            for (int i = 1; i < len0; i++) {
                int match = (lhs.charAt(i - 1) == rhs.charAt(j - 1)) ? 0 : 1;
                int costReplace = cost[i - 1] + match;
                int costInsert = cost[i] + 1;
                int costDelete = newcost[i - 1] + 1;
                newcost[i] = Math.min(Math.min(costInsert, costDelete), costReplace);
            }
            int[] swap = cost; cost = newcost; newcost = swap;
        }
        return cost[len0 - 1];
    }
}
