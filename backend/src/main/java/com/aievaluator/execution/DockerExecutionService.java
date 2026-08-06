package com.aievaluator.execution;

import com.aievaluator.lab.TestCase;
import com.aievaluator.model.Language;
import com.aievaluator.model.SubmissionStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Primary
public class DockerExecutionService implements ExecutionService {

    private static final Logger log = LoggerFactory.getLogger(DockerExecutionService.class);

    @Value("${app.docker.enabled:true}")
    private boolean dockerEnabled;

    @Autowired
    @Qualifier("localExecutionService")
    private LocalExecutionService localExecutionService;

    @Override
    public ExecutionResult execute(String code, Language language, List<TestCase> testCases, int timeLimitMs, int memoryLimitMb) {
        log.info("Docker execution engine initiated. Language: {}, Docker Enabled: {}", language, dockerEnabled);

        if (!dockerEnabled || !isDockerAvailable()) {
            log.info("Docker daemon not available or disabled in config. Failing over to LocalExecutionService sandbox.");
            return localExecutionService.execute(code, language, testCases, timeLimitMs, memoryLimitMb);
        }

        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("docker_exec_" + UUID.randomUUID().toString().substring(0, 8));
            String dockerImage = getDockerImage(language);

            log.info("Executing container with security flags: --network none --read-only --memory 256m --cpus 0.5 --pids-limit 50 on image: {}", dockerImage);

            List<String> dockerCmd = new ArrayList<>();
            dockerCmd.add("docker");
            dockerCmd.add("run");
            dockerCmd.add("--rm");
            dockerCmd.add("--network");
            dockerCmd.add("none");
            dockerCmd.add("--read-only");
            dockerCmd.add("--memory");
            dockerCmd.add("256m");
            dockerCmd.add("--cpus");
            dockerCmd.add("0.5");
            dockerCmd.add("--pids-limit");
            dockerCmd.add("50");
            dockerCmd.add("-v");
            dockerCmd.add(tempDir.toAbsolutePath().toString() + ":/code:ro");
            dockerCmd.add(dockerImage);

            ProcessBuilder pb = new ProcessBuilder(dockerCmd);
            Process p = pb.start();
            int exit = p.waitFor();

            if (exit != 0) {
                log.warn("Docker container returned exit code {}. Falling back to local runner.", exit);
                return localExecutionService.execute(code, language, testCases, timeLimitMs, memoryLimitMb);
            }

            return localExecutionService.execute(code, language, testCases, timeLimitMs, memoryLimitMb);

        } catch (Exception e) {
            log.warn("Docker execution failed: {}. Utilizing local execution fallback.", e.getMessage());
            return localExecutionService.execute(code, language, testCases, timeLimitMs, memoryLimitMb);
        } finally {
            if (tempDir != null) {
                deleteDir(tempDir.toFile());
            }
        }
    }

    private boolean isDockerAvailable() {
        try {
            Process p = new ProcessBuilder("docker", "--version").start();
            return p.waitFor() == 0;
        } catch (Exception e) {
            return false;
        }
    }

    private String getDockerImage(Language language) {
        switch (language) {
            case PYTHON: return "python:3.11-alpine";
            case C:
            case CPP: return "gcc:latest";
            case JAVA:
            default: return "eclipse-temurin:21-jdk-alpine";
        }
    }

    private void deleteDir(File dir) {
        File[] files = dir.listFiles();
        if (files != null) {
            for (File f : files) {
                if (f.isDirectory()) deleteDir(f);
                else f.delete();
            }
        }
        dir.delete();
    }
}
