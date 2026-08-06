package com.aievaluator.submission;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByUserIdOrderBySubmittedAtDesc(Long userId);
    List<Submission> findByQuestionIdOrderBySubmittedAtDesc(Long questionId);
    List<Submission> findByQuestionLabIdOrderBySubmittedAtDesc(Long labId);
    long countByUserIdAndStatus(Long userId, com.aievaluator.model.SubmissionStatus status);
}
