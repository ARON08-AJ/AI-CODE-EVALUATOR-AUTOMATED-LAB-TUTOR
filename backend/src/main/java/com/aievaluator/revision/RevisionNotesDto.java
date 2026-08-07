package com.aievaluator.revision;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class RevisionNotesDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NotesResponse {
        private String topic;
        private List<String> keyConcepts;
        private List<String> importantFormulasAndComplexities;
        private List<String> commonPitfallsAndMistakes;
        private List<String> topInterviewQuestions;
        private List<String> revisionChecklist;
    }
}
