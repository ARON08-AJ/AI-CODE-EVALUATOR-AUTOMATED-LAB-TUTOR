import React from 'react';
import Editor from '@monaco-editor/react';
import { Code2, RotateCcw, Copy, Check } from 'lucide-react';

const STARTER_TEMPLATES = {
  PYTHON: `# Python 3 Solution
def main():
    import sys
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    # Write your solution logic here
    n = int(input_data[0])
    if n % 2 == 0:
        print("Even")
    else:
        print("Odd")

if __name__ == "__main__":
    main()
`,
  C: `// C Language Solution
#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) == 1) {
        if (n % 2 == 0) {
            printf("Even\\n");
        } else {
            printf("Odd\\n");
        }
    }
    return 0;
}
`,
  CPP: `// C++ Solution
#include <iostream>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    int n;
    if (cin >> n) {
        if (n % 2 == 0) {
            cout << "Even" << endl;
        } else {
            cout << "Odd" << endl;
        }
    }
    return 0;
}
`,
  JAVA: `// Java Solution
import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) {
            int n = sc.nextInt();
            if (n % 2 == 0) {
                System.out.println("Even");
            } else {
                System.out.println("Odd");
            }
        }
    }
}
`
};

const MONACO_LANG_MAP = {
  PYTHON: 'python',
  C: 'c',
  CPP: 'cpp',
  JAVA: 'java'
};

export default function MonacoEditorWindow({ code, setCode, language, setLanguage, readOnly = false }) {
  const [copied, setCopied] = React.useState(false);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    setCode(STARTER_TEMPLATES[newLang] || '');
  };

  const handleReset = () => {
    if (window.confirm("Reset editor to starter template?")) {
      setCode(STARTER_TEMPLATES[language] || '');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-lg">
      {/* Editor Top Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Code2 className="w-5 h-5 text-sky-400" />
          <span className="font-semibold text-sm text-slate-200">Online Code Editor</span>
          <span className="px-2 py-0.5 text-xs font-mono bg-sky-950 text-sky-300 border border-sky-800 rounded">
            Monaco Engine
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <select
            value={language}
            onChange={handleLanguageChange}
            disabled={readOnly}
            className="bg-slate-900 text-slate-200 text-xs font-mono px-3 py-1.5 rounded border border-slate-700 focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="PYTHON">Python 3</option>
            <option value="C">C (GCC)</option>
            <option value="CPP">C++ (G++)</option>
            <option value="JAVA">Java 21</option>
          </select>

          {/* Controls */}
          {!readOnly && (
            <button
              onClick={handleReset}
              title="Reset Code"
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleCopy}
            title="Copy Code"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Monaco Code Editor Container */}
      <div className="flex-1 min-h-[350px]">
        <Editor
          height="100%"
          language={MONACO_LANG_MAP[language] || 'python'}
          theme="vs-dark"
          value={code}
          onChange={(value) => setCode(value || '')}
          options={{
            readOnly: readOnly,
            fontSize: 14,
            fontFamily: "'Fira Code', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            padding: { top: 12, bottom: 12 },
            lineNumbersMinChars: 3,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
          }}
        />
      </div>
    </div>
  );
}
