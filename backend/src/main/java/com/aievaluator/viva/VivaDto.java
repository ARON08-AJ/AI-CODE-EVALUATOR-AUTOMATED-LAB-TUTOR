package com.aievaluator.viva;

import com.aievaluator.model.Language;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class VivaDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VivaRequest {
        private String code;
        private Language language;
        private String problemTitle;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VivaQuestionResponse {
        private String problemTitle;
        private List<String> vivaQuestions;
        private String focusArea;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VivaEvaluationRequest {
        private String code;
        private String vivaQuestion;
        private String studentAnswer;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VivaEvaluationResponse {
        private int vivaScore; // 0 - 100
        private String verdict; // CONCEPTUALLY_SOUND, PARTIAL_COMPREHENSION, NEEDS_REVISION
        private String feedback;
        private String modelDefenseExplanation;
    }
}
