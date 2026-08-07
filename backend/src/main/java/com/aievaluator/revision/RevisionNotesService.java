package com.aievaluator.revision;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RevisionNotesService {

    private static final Logger log = LoggerFactory.getLogger(RevisionNotesService.class);

    public RevisionNotesDto.NotesResponse generateRevisionNotes(String topic) {
        log.info("Generating AI revision notes for topic: {}", topic);

        String topicName = topic != null ? topic : "Arrays & Two-Pointer Techniques";

        return RevisionNotesDto.NotesResponse.builder()
                .topic(topicName)
                .keyConcepts(List.of(
                        "Contiguous Memory Allocation & O(1) Index Access",
                        "Two-Pointer Technique (Left & Right converging pointers)",
                        "Sliding Window Technique for Subarray Optimization"
                ))
                .importantFormulasAndComplexities(List.of(
                        "Time Complexity: Access O(1), Search O(N), Insertion O(N)",
                        "Mid calculation formula to prevent integer overflow: `mid = low + (high - low) / 2`",
                        "Prefix Sum Array: `prefix[i] = prefix[i-1] + arr[i]`"
                ))
                .commonPitfallsAndMistakes(List.of(
                        "Off-by-one errors using `<=` instead of `<` in loop termination conditions",
                        "Uninitialized array elements accessing garbage values in C/C++",
                        "Modifying array length during iteration causing index out of bounds"
                ))
                .topInterviewQuestions(List.of(
                        "Find Two Numbers in a Sorted Array that Add up to Target (Two-Sum II)",
                        "Maximum Subarray Sum (Kadane's Algorithm)",
                        "Move Zeroes to End of Array in O(N) Time and O(1) Space"
                ))
                .revisionChecklist(List.of(
                        "Verified empty array boundary test case",
                        "Tested array with single element",
                        "Tested array with negative integer values",
                        "Verified O(1) extra space constraint"
                ))
                .build();
    }
}
