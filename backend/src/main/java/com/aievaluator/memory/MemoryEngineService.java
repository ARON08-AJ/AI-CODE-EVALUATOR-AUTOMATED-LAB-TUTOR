package com.aievaluator.memory;

import com.aievaluator.auth.User;
import com.aievaluator.model.SubmissionStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
public class MemoryEngineService {

    private static final Logger log = LoggerFactory.getLogger(MemoryEngineService.class);

    private final StudentMemoryRepository memoryRepository;

    public MemoryEngineService(StudentMemoryRepository memoryRepository) {
        this.memoryRepository = memoryRepository;
    }

    public void recordStudentMistake(User user, SubmissionStatus status, String topic, String errorSig, String advice) {
        if (status == SubmissionStatus.ACCEPTED) return;

        log.info("Recording student memory mistake for user: {}, topic: {}", user.getEmail(), topic);
        StudentMemory memory = StudentMemory.builder()
                .user(user)
                .status(status)
                .topicCategory(topic != null ? topic : "General Syntax")
                .errorSignature(errorSig != null ? errorSig : "Execution Failure")
                .AIAdviceGiven(advice)
                .build();
        memoryRepository.save(memory);
    }

    public List<String> getLongTermMemoryRecall(User user, String currentTopic) {
        List<String> recallAlerts = new ArrayList<>();
        List<StudentMemory> memories = memoryRepository.findByUserIdOrderByOccurredAtDesc(user.getId());

        for (StudentMemory m : memories) {
            long daysAgo = ChronoUnit.DAYS.between(m.getOccurredAt(), LocalDateTime.now());
            if (daysAgo >= 1) {
                recallAlerts.add(String.format(
                        "Long-Term Memory Recall: You encountered a similar '%s' issue (%s) %d day(s) ago.",
                        m.getTopicCategory(), m.getErrorSignature(), daysAgo
                ));
            }
            if (recallAlerts.size() >= 3) break;
        }

        if (recallAlerts.isEmpty()) {
            recallAlerts.add("Memory Engine Active: Building long-term learning history and tracking error patterns.");
        }
        return recallAlerts;
    }
}
