package com.aievaluator;

import com.aievaluator.auth.Role;
import com.aievaluator.auth.User;
import com.aievaluator.auth.UserRepository;
import com.aievaluator.lab.Lab;
import com.aievaluator.lab.LabRepository;
import com.aievaluator.lab.Question;
import com.aievaluator.lab.TestCase;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final LabRepository labRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           LabRepository labRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.labRepository = labRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            log.info("Seeding initial database users and sample programming labs...");

            User student = userRepository.save(User.builder()
                    .email("student@lab.edu")
                    .password(passwordEncoder.encode("password123"))
                    .fullName("Alex Student")
                    .role(Role.STUDENT)
                    .build());

            User faculty = userRepository.save(User.builder()
                    .email("faculty@lab.edu")
                    .password(passwordEncoder.encode("password123"))
                    .fullName("Dr. Sarah Instructor")
                    .role(Role.FACULTY)
                    .build());

            // Create Lab 1
            Lab lab1 = Lab.builder()
                    .title("Lab 1: Control Flow & Basic Data Structures")
                    .description("Solve basic programming problems in Python, C, C++, or Java to master condition checks, loops, and array manipulation.")
                    .courseCode("CS101")
                    .deadline(LocalDateTime.now().plusDays(14))
                    .createdBy(faculty)
                    .build();

            // Question 1
            Question q1 = Question.builder()
                    .title("Even or Odd Integer Check")
                    .problemStatement("Write a program that takes an integer input from standard input and prints 'Even' if the number is even, or 'Odd' if the number is odd.")
                    .sampleInput("4")
                    .sampleOutput("Even")
                    .allowedLanguages("C,CPP,JAVA,PYTHON")
                    .timeLimitMs(2000)
                    .memoryLimitMb(256)
                    .lab(lab1)
                    .build();

            q1.getTestCases().add(TestCase.builder().input("4").expectedOutput("Even").isPublic(true).question(q1).build());
            q1.getTestCases().add(TestCase.builder().input("7").expectedOutput("Odd").isPublic(true).question(q1).build());
            q1.getTestCases().add(TestCase.builder().input("0").expectedOutput("Even").isPublic(false).question(q1).build());
            q1.getTestCases().add(TestCase.builder().input("-3").expectedOutput("Odd").isPublic(false).question(q1).build());

            // Question 2
            Question q2 = Question.builder()
                    .title("Sum of Array Elements")
                    .problemStatement("Given an integer $N$ followed by $N$ integers, output the sum of all elements.")
                    .sampleInput("5\n1 2 3 4 5")
                    .sampleOutput("15")
                    .allowedLanguages("C,CPP,JAVA,PYTHON")
                    .timeLimitMs(2000)
                    .memoryLimitMb(256)
                    .lab(lab1)
                    .build();

            q2.getTestCases().add(TestCase.builder().input("5\n1 2 3 4 5").expectedOutput("15").isPublic(true).question(q2).build());
            q2.getTestCases().add(TestCase.builder().input("3\n10 20 30").expectedOutput("60").isPublic(false).question(q2).build());

            lab1.getQuestions().addAll(List.of(q1, q2));
            labRepository.save(lab1);

            log.info("Database seeding complete. Preloaded Student: student@lab.edu, Faculty: faculty@lab.edu (password: password123)");
        }
    }
}
