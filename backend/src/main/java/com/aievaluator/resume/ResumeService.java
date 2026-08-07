package com.aievaluator.resume;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

@Service
public class ResumeService {

    private static final Logger log = LoggerFactory.getLogger(ResumeService.class);

    private static final List<String> CORE_TECH_KEYWORDS = List.of(
            "Java", "Python", "C++", "Spring Boot", "React", "Docker", "SQL", "Git", "REST API",
            "Data Structures", "Algorithms", "AWS", "CI/CD", "Linux", "JUnit", "TypeScript",
            "Microservices", "Hibernate", "PostgreSQL", "Node.js", "Kubernetes", "Redis"
    );

    public ResumeDto.ResumeResponse analyzePdfFile(MultipartFile file, String targetRole, String githubUsername) {
        log.info("Analyzing uploaded PDF resume file: {}, size: {} bytes", file.getOriginalFilename(), file.getSize());

        String extractedText = "";
        try {
            extractedText = extractTextFromPdf(file.getBytes());
        } catch (Exception e) {
            log.error("Failed to extract text from PDF file", e);
            extractedText = "Error reading PDF file. Ensure file is a valid non-encrypted PDF document.";
        }

        return analyzeResume(extractedText, targetRole, githubUsername);
    }

    public ResumeDto.ResumeResponse analyzeResume(String resumeText, String targetRole, String githubUsername) {
        log.info("Analyzing resume text for target role: {}, github: {}", targetRole, githubUsername);

        String textLower = resumeText != null ? resumeText.toLowerCase() : "";

        List<String> matched = new ArrayList<>();
        List<String> missing = new ArrayList<>();

        for (String skill : CORE_TECH_KEYWORDS) {
            if (textLower.contains(skill.toLowerCase())) {
                matched.add(skill);
            } else {
                missing.add(skill);
            }
        }

        int atsScore = Math.min(100, Math.max(35, (matched.size() * 100) / CORE_TECH_KEYWORDS.size()));

        List<String> formatWarnings = new ArrayList<>();
        if (!textLower.contains("education") && !textLower.contains("university") && !textLower.contains("bachelor")) {
            formatWarnings.add("Education section missing or unparsed by ATS scanner.");
        }
        if (!textLower.contains("projects") && !textLower.contains("github")) {
            formatWarnings.add("Projects section missing or lacks repository links.");
        }
        if (!textLower.contains("achievements") && !textLower.contains("metrics") && !textLower.contains("improved")) {
            formatWarnings.add("Add quantified impact metrics (e.g. 'Improved response speed by 35%').");
        }

        int portfolioScore = 75;
        if (githubUsername != null && !githubUsername.trim().isEmpty()) {
            portfolioScore = 92;
        }

        List<String> actionPlan = new ArrayList<>();
        if (!missing.isEmpty()) {
            actionPlan.add("Add portfolio projects demonstrating: " + String.join(", ", missing.subList(0, Math.min(4, missing.size()))));
        }
        actionPlan.add("Include quantifiable metrics in project bullet points to improve ATS keyword ranking.");
        actionPlan.add("Link pinned GitHub repositories directly in your resume contact header.");

        String summary = String.format(
                "Resume achieves an ATS Compatibility Score of %d%% for '%s'. Matched %d core technical keywords.",
                atsScore, targetRole != null ? targetRole : "Software Engineer", matched.size()
        );

        return ResumeDto.ResumeResponse.builder()
                .atsScore(atsScore)
                .portfolioScore(portfolioScore)
                .targetRole(targetRole != null ? targetRole : "Software Engineer")
                .matchedSkills(matched)
                .missingSkills(missing)
                .formatWarnings(formatWarnings)
                .actionPlan(actionPlan)
                .summary(summary)
                .build();
    }

    private String extractTextFromPdf(byte[] pdfBytes) throws IOException {
        try (PDDocument document = Loader.loadPDF(pdfBytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }
}
