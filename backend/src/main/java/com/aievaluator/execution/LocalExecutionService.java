package com.aievaluator.execution;

import com.aievaluator.lab.TestCase;
import com.aievaluator.model.Language;
import com.aievaluator.model.SubmissionStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service("localExecutionService")
public class LocalExecutionService implements ExecutionService {

    private static final Logger log = LoggerFactory.getLogger(LocalExecutionService.class);

    @Override
    public ExecutionResult execute(String code, Language language, List<TestCase> testCases, int timeLimitMs, int memoryLimitMb) {
        log.info("Executing code locally for language: {}, test cases count: {}", language, testCases.size());

        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("lab_exec_" + UUID.randomUUID().toString().substring(0, 8));
            long startTime = System.currentTimeMillis();

            // 1. Prepare Source Files & Compile if necessary
            CompileStep compileStep = prepareAndCompile(tempDir, code, language);
            if (!compileStep.isSuccess()) {
                log.warn("Local execution compilation failed: {}", compileStep.getStderr());
                return ExecutionResult.builder()
                        .status(SubmissionStatus.COMPILATION_ERROR)
                        .stderr(compileStep.getStderr())
                        .stdout("")
                        .passCount(0)
                        .totalTestCases(testCases.size())
                        .executionTimeMs(System.currentTimeMillis() - startTime)
                        .memoryUsedKb(0)
                        .build();
            }

            // 2. Execute test cases
            int passCount = 0;
            String lastStdout = "";
            String lastStderr = "";
            long maxExecTime = 0;

            for (int i = 0; i < testCases.size(); i++) {
                TestCase tc = testCases.get(i);
                long tcStart = System.currentTimeMillis();

                ProcessResult pr = runTestCaseProcess(tempDir, language, compileStep.getExecCmd(), tc.getInput(), timeLimitMs);
                long tcElapsed = System.currentTimeMillis() - tcStart;
                if (tcElapsed > maxExecTime) maxExecTime = tcElapsed;

                if (pr.isTimedOut()) {
                    log.warn("Test case {} timed out after {} ms", i + 1, timeLimitMs);
                    return ExecutionResult.builder()
                            .status(SubmissionStatus.TIME_LIMIT_EXCEEDED)
                            .stderr("Time Limit Exceeded (" + timeLimitMs + " ms)")
                            .stdout(pr.getStdout())
                            .passCount(passCount)
                            .totalTestCases(testCases.size())
                            .executionTimeMs(maxExecTime)
                            .memoryUsedKb(1024)
                            .build();
                }

                if (pr.getExitCode() != 0) {
                    log.warn("Test case {} failed with exit code: {}", i + 1, pr.getExitCode());
                    return ExecutionResult.builder()
                            .status(SubmissionStatus.RUNTIME_ERROR)
                            .stderr(pr.getStderr())
                            .stdout(pr.getStdout())
                            .passCount(passCount)
                            .totalTestCases(testCases.size())
                            .executionTimeMs(maxExecTime)
                            .memoryUsedKb(2048)
                            .build();
                }

                String actualOutput = normalizeOutput(pr.getStdout());
                String expectedOutput = normalizeOutput(tc.getExpectedOutput());
                lastStdout = pr.getStdout();
                lastStderr = pr.getStderr();

                if (actualOutput.equals(expectedOutput)) {
                    passCount++;
                } else {
                    log.info("Test case {} output mismatch. Expected: '{}', Got: '{}'", i + 1, expectedOutput, actualOutput);
                    return ExecutionResult.builder()
                            .status(SubmissionStatus.WRONG_ANSWER)
                            .stdout(pr.getStdout())
                            .stderr(pr.getStderr())
                            .passCount(passCount)
                            .totalTestCases(testCases.size())
                            .executionTimeMs(maxExecTime)
                            .memoryUsedKb(1500)
                            .failedInput(tc.isPublic() ? tc.getInput() : "[Hidden Test Case]")
                            .failedExpectedOutput(tc.isPublic() ? tc.getExpectedOutput() : "[Hidden Test Case]")
                            .failedActualOutput(tc.isPublic() ? pr.getStdout() : "[Hidden Test Case Output]")
                            .build();
                }
            }

            log.info("Execution successful! Passed all {}/{} test cases", passCount, testCases.size());
            return ExecutionResult.builder()
                    .status(SubmissionStatus.ACCEPTED)
                    .stdout(lastStdout)
                    .stderr(lastStderr)
                    .passCount(passCount)
                    .totalTestCases(testCases.size())
                    .executionTimeMs(maxExecTime)
                    .memoryUsedKb(2400)
                    .build();

        } catch (Exception e) {
            log.error("Execution exception", e);
            return ExecutionResult.builder()
                    .status(SubmissionStatus.RUNTIME_ERROR)
                    .stderr("Execution Exception: " + e.getMessage())
                    .stdout("")
                    .passCount(0)
                    .totalTestCases(testCases.size())
                    .executionTimeMs(0)
                    .memoryUsedKb(0)
                    .build();
        } finally {
            if (tempDir != null) {
                deleteDir(tempDir.toFile());
            }
        }
    }

    private CompileStep prepareAndCompile(Path dir, String code, Language language) throws IOException, InterruptedException {
        String filename;
        String execCmd;

        switch (language) {
            case PYTHON:
                filename = "solution.py";
                Files.writeString(dir.resolve(filename), code);
                return new CompileStep(true, "", "python " + dir.resolve(filename).toAbsolutePath());

            case C:
                filename = "solution.c";
                Path cFile = dir.resolve(filename);
                Path cExe = dir.resolve("solution.exe");
                Files.writeString(cFile, code);

                ProcessBuilder cPb = new ProcessBuilder("gcc", cFile.toAbsolutePath().toString(), "-o", cExe.toAbsolutePath().toString());
                cPb.directory(dir.toFile());
                Process cProc = cPb.start();
                String cErr = readStream(cProc.getErrorStream());
                boolean cSuccess = cProc.waitFor(10, TimeUnit.SECONDS) && cProc.exitValue() == 0;
                return new CompileStep(cSuccess, cErr, cExe.toAbsolutePath().toString());

            case CPP:
                filename = "solution.cpp";
                Path cppFile = dir.resolve(filename);
                Path cppExe = dir.resolve("solution.exe");
                Files.writeString(cppFile, code);

                ProcessBuilder cppPb = new ProcessBuilder("g++", cppFile.toAbsolutePath().toString(), "-o", cppExe.toAbsolutePath().toString());
                cppPb.directory(dir.toFile());
                Process cppProc = cppPb.start();
                String cppErr = readStream(cppProc.getErrorStream());
                boolean cppSuccess = cppProc.waitFor(10, TimeUnit.SECONDS) && cppProc.exitValue() == 0;
                return new CompileStep(cppSuccess, cppErr, cppExe.toAbsolutePath().toString());

            case JAVA:
            default:
                String className = extractJavaClassName(code);
                filename = className + ".java";
                Path javaFile = dir.resolve(filename);
                Files.writeString(javaFile, code);

                ProcessBuilder javaPb = new ProcessBuilder("javac", javaFile.toAbsolutePath().toString());
                javaPb.directory(dir.toFile());
                Process javaProc = javaPb.start();
                String javaErr = readStream(javaProc.getErrorStream());
                boolean javaSuccess = javaProc.waitFor(10, TimeUnit.SECONDS) && javaProc.exitValue() == 0;
                return new CompileStep(javaSuccess, javaErr, "java -cp " + dir.toAbsolutePath().toString() + " " + className);
        }
    }

    private ProcessResult runTestCaseProcess(Path dir, Language language, String execCmd, String input, int timeLimitMs) throws IOException, InterruptedException {
        String[] cmdParts = execCmd.split(" ");
        ProcessBuilder pb = new ProcessBuilder(cmdParts);
        pb.directory(dir.toFile());

        Process process = pb.start();

        if (input != null && !input.trim().isEmpty()) {
            try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(process.getOutputStream()))) {
                writer.write(input);
                writer.flush();
            }
        } else {
            process.getOutputStream().close();
        }

        boolean completed = process.waitFor(timeLimitMs, TimeUnit.MILLISECONDS);
        if (!completed) {
            process.destroyForcibly();
            return new ProcessResult(true, -1, "", "Time Limit Exceeded");
        }

        String stdout = readStream(process.getInputStream());
        String stderr = readStream(process.getErrorStream());
        return new ProcessResult(false, process.exitValue(), stdout, stderr);
    }

    private String extractJavaClassName(String code) {
        if (code.contains("public class ")) {
            int idx = code.indexOf("public class ") + 13;
            StringBuilder sb = new StringBuilder();
            while (idx < code.length() && Character.isJavaIdentifierPart(code.charAt(idx))) {
                sb.append(code.charAt(idx));
                idx++;
            }
            if (sb.length() > 0) return sb.toString();
        }
        return "Solution";
    }

    private String normalizeOutput(String str) {
        if (str == null) return "";
        return str.replaceAll("\r\n", "\n").replaceAll("\r", "\n").trim();
    }

    private String readStream(InputStream is) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(is));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            sb.append(line).append("\n");
        }
        return sb.toString().trim();
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

    private static class CompileStep {
        private final boolean success;
        private final String stderr;
        private final String execCmd;

        public CompileStep(boolean success, String stderr, String execCmd) {
            this.success = success;
            this.stderr = stderr;
            this.execCmd = execCmd;
        }

        public boolean isSuccess() { return success; }
        public String getStderr() { return stderr; }
        public String getExecCmd() { return execCmd; }
    }

    private static class ProcessResult {
        private final boolean timedOut;
        private final int exitCode;
        private final String stdout;
        private final String stderr;

        public ProcessResult(boolean timedOut, int exitCode, String stdout, String stderr) {
            this.timedOut = timedOut;
            this.exitCode = exitCode;
            this.stdout = stdout;
            this.stderr = stderr;
        }

        public boolean isTimedOut() { return timedOut; }
        public int getExitCode() { return exitCode; }
        public String getStdout() { return stdout; }
        public String getStderr() { return stderr; }
    }
}
