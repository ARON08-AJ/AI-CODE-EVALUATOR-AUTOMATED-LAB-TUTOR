package com.aievaluator.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIHintResponse {
    private String analysis;
    private String hint1;
    private String hint2;
    private String hint3;
    private List<String> recommendedTopics;
}
