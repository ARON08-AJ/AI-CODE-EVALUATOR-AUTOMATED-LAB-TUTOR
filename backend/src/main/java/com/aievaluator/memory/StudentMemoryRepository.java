package com.aievaluator.memory;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentMemoryRepository extends JpaRepository<StudentMemory, Long> {
    List<StudentMemory> findByUserIdOrderByOccurredAtDesc(Long userId);
    List<StudentMemory> findByUserIdAndTopicCategoryOrderByOccurredAtDesc(Long userId, String topicCategory);
}
