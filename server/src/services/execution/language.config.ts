import { LanguageConfig, SupportedLanguage } from './execution.types';

const isWindows = process.platform === 'win32';
const pythonCmd = isWindows ? 'python' : 'python3';

export const languageConfigs: Record<SupportedLanguage, LanguageConfig> = {
  'C': {
    compiler: 'gcc',
    compileRequired: true,
    sourceFilename: 'main.c',
    executableFilename: isWindows ? 'main.exe' : 'main',
    compileArgs: (source, executable) => [source, '-O2', '-o', executable],
    executeArgs: (executable) => [isWindows ? executable : `./${executable}`],
  },
  'C++': {
    compiler: 'g++',
    compileRequired: true,
    sourceFilename: 'main.cpp',
    executableFilename: isWindows ? 'main.exe' : 'main',
    compileArgs: (source, executable) => [source, '-O2', '-std=c++17', '-o', executable],
    executeArgs: (executable) => [isWindows ? executable : `./${executable}`],
  },
  'Java': {
    compiler: 'javac',
    compileRequired: true,
    sourceFilename: 'Main.java',
    mainClass: 'Main',
    compileArgs: (source) => ['-J-XX:TieredStopAtLevel=1', '-J-Xmx128m', source],
    executeArgs: (_, mainClass) => ['java', '-cp', '.', mainClass!],
  },
  'Python': {
    interpreter: pythonCmd,
    compileRequired: false,
    sourceFilename: 'main.py',
    executeArgs: (source) => [pythonCmd, source],
  }
};
