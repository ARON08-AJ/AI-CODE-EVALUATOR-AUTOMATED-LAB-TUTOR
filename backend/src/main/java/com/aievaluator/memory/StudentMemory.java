package com.aievaluator.memory;

import com.aievaluator.auth.User;
import com.aievaluator.model.SubmissionStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "student_memories")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentMemory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    private SubmissionStatus status;

    private String topicCategory; // e.g., "Arrays", "Loop Boundaries", "Recursion", "Null Pointers"
    private String errorSignature; // e.g., "IndexOutOfBoundsException near loop condition"
    private String AIAdviceGiven;

    @Column(nullable = false)
    private LocalDateTime occurredAt;

    @PrePersist
    protected void onCreate() {
        if (occurredAt == null) {
            occurredAt = LocalDateTime.now();
        }
    }
}
