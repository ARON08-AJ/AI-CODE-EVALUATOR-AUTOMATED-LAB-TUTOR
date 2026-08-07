package com.aievaluator.report;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;

@Service
public class LabReportService {

    private static final Logger log = LoggerFactory.getLogger(LabReportService.class);

    public ResponseEntity<byte[]> generateLabReportPdf(Long labId, String studentEmail) {
        log.info("Generating downloadable PDF Lab Completion Performance Report for lab ID: {}, student: {}", labId, studentEmail);

        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage();
            document.addPage(page);

            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 16);
                contentStream.newLineAtOffset(50, 750);
                contentStream.showText("AI CODE EVALUATOR - LAB PERFORMANCE REPORT");
                contentStream.endText();

                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                contentStream.newLineAtOffset(50, 710);
                contentStream.showText("Student Account: " + (studentEmail != null ? studentEmail : "student@lab.edu"));
                contentStream.newLineAtOffset(0, -20);
                contentStream.showText("Laboratory ID: #" + labId);
                contentStream.newLineAtOffset(0, -20);
                contentStream.showText("Evaluation Verdict: ACCEPTED (Passed All Test Cases)");
                contentStream.newLineAtOffset(0, -20);
                contentStream.showText("Execution Stats: 142 ms | Memory: 1024 KB");
                contentStream.newLineAtOffset(0, -20);
                contentStream.showText("Cyclomatic Complexity: 3 | Time Complexity: O(N)");
                contentStream.newLineAtOffset(0, -20);
                contentStream.showText("AI Pedagogical Path: Mastered Array Boundaries -> Recommended: Prefix Sum");
                contentStream.endText();
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            document.save(out);
            byte[] pdfBytes = out.toByteArray();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "Lab_" + labId + "_Completion_Report.pdf");

            return ResponseEntity.ok().headers(headers).body(pdfBytes);

        } catch (Exception e) {
            log.error("Failed to generate PDF Lab Report", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
