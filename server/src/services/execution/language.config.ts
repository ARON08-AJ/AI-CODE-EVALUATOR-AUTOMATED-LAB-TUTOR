import { LanguageConfig, SupportedLanguage } from './execution.types';

export const languageConfigs: Record<SupportedLanguage, LanguageConfig> = {
  'C': {
    compiler: 'gcc',
    compileRequired: true,
    sourceFilename: 'main.c',
    executableFilename: 'main',
    compileArgs: (source, executable) => [source, '-O2', '-o', executable],
    executeArgs: (executable) => [`./${executable}`],
  },
  'C++': {
    compiler: 'g++',
    compileRequired: true,
    sourceFilename: 'main.cpp',
    executableFilename: 'main',
    compileArgs: (source, executable) => [source, '-O2', '-std=c++17', '-o', executable],
    executeArgs: (executable) => [`./${executable}`],
  },
  'Java': {
    compiler: 'javac',
    compileRequired: true,
    sourceFilename: 'Main.java',
    mainClass: 'Main',
    compileArgs: (source) => ['-J-XX:TieredStopAtLevel=1', '-J-Xmx128m', source],
    executeArgs: (_, mainClass) => ['java', '-XX:TieredStopAtLevel=1', '-Xmx128m', mainClass!],
  },
  'Python': {
    interpreter: 'python3',
    compileRequired: false,
    sourceFilename: 'main.py',
    executeArgs: (source) => ['python3', source],
  }
};
