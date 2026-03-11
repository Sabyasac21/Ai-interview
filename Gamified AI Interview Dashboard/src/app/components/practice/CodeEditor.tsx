import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Send, RotateCcw, Lightbulb } from 'lucide-react';
import { Question } from '../../data/questions';
import { usePreferences } from '../../../context/PreferencesContext';

interface CodeEditorProps {
  question: Question;
  onSubmit: (code: string, language: string) => void;
  onRun: (code: string, language: string) => void;
  initialCode?: string;
  initialLanguage?: string;
  onHintUsed?: (count: number) => void;
}

// DSA template functions for different languages
const getDSATemplate = (language: string, questionTitle: string, params: string = 'input'): string => {
  const templates: Record<string, string> = {
    javascript: `// Solution for: ${questionTitle}
// TODO: Implement your solution here

function solve(${params}) {
  // Write your code here
  // return your result
}
`,

    typescript: `// Solution for: ${questionTitle}
// TODO: Implement your solution here

function solve(${params}: any): any {
  // Write your code here
  // return your result
}
`,

    python: `# Solution for: ${questionTitle}
# TODO: Implement your solution here

def solve(${params}):
    # Write your code here
    pass
`,

    java: `// Solution for: ${questionTitle}
// TODO: Implement your solution here

public class Solution {
    public Object solve(Object ${params}) {
        // Write your code here
        
        return null;
    }
}`,

    cpp: `// Solution for: ${questionTitle}
// TODO: Implement your solution here

#include <iostream>
using namespace std;

// Write your function here
// Type solve(Type ${params}) {
//     // Your code here
// }

int main() {
    return 0;
}`,

    csharp: `// Solution for: ${questionTitle}
// TODO: Implement your solution here

public class Solution {
    public object Solve(object ${params}) {
        // Write your code here
        
        return null;
    }
}`,

    go: `// Solution for: ${questionTitle}
// TODO: Implement your solution here

package main

import "fmt"

func solve(input interface{}) interface{} {
    // Write your code here
    
    return nil
}

func main() {
}`,

    ruby: `# Solution for: ${questionTitle}
# TODO: Implement your solution here

def solve(input)
  # Write your code here
  
end
`,

    php: `<?php
// Solution for: ${questionTitle}
// TODO: Implement your solution here

function solve($input) {
    // Write your code here
    
    return null;
}
?>`
  };

  return templates[language] || '';
};

export const CodeEditor: React.FC<CodeEditorProps> = ({ question, onSubmit, onRun, initialCode, initialLanguage, onHintUsed }) => {
  // supported languages and mapping to Monaco editor identifiers
  const LANGUAGES: { label: string; value: string; monaco: string }[] = [
    { label: 'JavaScript', value: 'javascript', monaco: 'javascript' },
    { label: 'TypeScript', value: 'typescript', monaco: 'typescript' },
    { label: 'Python', value: 'python', monaco: 'python' },
    { label: 'Java', value: 'java', monaco: 'java' },
    { label: 'C++', value: 'cpp', monaco: 'cpp' },
    { label: 'C#', value: 'csharp', monaco: 'csharp' },
    { label: 'Go', value: 'go', monaco: 'go' },
    { label: 'Ruby', value: 'ruby', monaco: 'ruby' },
    { label: 'PHP', value: 'php', monaco: 'php' },
  ];

  // Check if question is coding-related (DSA/Algorithms)
  // Detect by tags or assume all in this editor are coding problems
  const isCodingQuestion = !question.type || question.type === 'coding' || question.tags?.some(tag => {
    const lowerTag = tag.toLowerCase();
    const codingKeywords = [
      'dsa', 'algorithm', 'data structure', 'array', 'hash', 'map', 'set', 
      'stack', 'queue', 'tree', 'graph', 'linked list', 'sort', 'search',
      'dynamic programming', 'recursion', 'backtracking', 'greedy', 'binary search',
      'string', 'matrix', 'heap', 'trie', 'bit manipulation'
    ];
    return codingKeywords.some(keyword => lowerTag.includes(keyword));
  });

  const getInitialCode = (lang: string): string => {
    const starterCodeTyped = question.starterCode as Record<string, string> | undefined;
    if (starterCodeTyped?.[lang]) {
      return starterCodeTyped[lang];
    }
    // Provide template if no starter code and is a coding question
    if (isCodingQuestion) {
      // derive parameter list from first test case (support both camelCase and snake_case)
      let params = 'input';
      const testCases: any[] | undefined =
        (question as any).test_cases || (question as any).testCases;
      const firstCase = testCases?.[0];
      // debug: log test case shape when present
      if (firstCase) {
        // lightweight runtime debug to inspect incoming question shape
        // eslint-disable-next-line no-console
        console.debug('[CodeEditor] firstCase:', firstCase);
      }
      if (firstCase) {
        const fi = firstCase.input;
        if (fi && typeof fi === 'object' && !Array.isArray(fi)) {
          const keys = Object.keys(fi);
          if (keys.length === 1) {
            params = keys[0];
          } else if (keys.length > 1) {
            params = keys.join(', ');
          }
        } else if (typeof fi === 'string') {
          // legacy string like "nums=[2,7,11,15], target=9" -> extract all param names
          const names = fi.match(/\w+(?=\s*=)/g) || [];
          if (names.length === 1) {
            params = names[0];
          } else if (names.length > 1) {
            params = names.join(', ');
          }
        }
      }
      // if question provided starter_code with different signature, that usually wins
      const starter = (question as any).starter_code || (question as any).starterCode;
      // debug: log derived params before applying starter_code override
      // eslint-disable-next-line no-console
      console.debug('[CodeEditor] derived params (pre-starter):', params);
      if (starter && starter[lang]) {
        // attempt to extract parameter list from starter code too
        const match = starter[lang].match(/function\s+\w+\s*\(([^)]*)\)/);
        if (match) {
          const decl = match[1].trim();
          if (decl) params = decl;
        }
      }
      // debug: final params used for template
      // eslint-disable-next-line no-console
      console.debug('[CodeEditor] final params:', params);
      return getDSATemplate(lang, question.title, params);
    }
    return '';
  };

  // preferences for editor styling
  const { theme, keybinding, fontSize } = usePreferences();

  const initialLang = initialLanguage || LANGUAGES[0].value;
  const [language, setLanguage] = useState<string>(initialLang);
  const [code, setCode] = useState<string>(
    initialCode !== undefined
      ? initialCode
      : getInitialCode(initialLang)
  );
  const [showHint, setShowHint] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);

  React.useEffect(() => {
    setShowHint(false);
    setCurrentHintIndex(0);
    onHintUsed?.(0);
  }, [question.id]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    // when user manually changes language, reset to appropriate starter/template
    setCode(getInitialCode(newLang));
  };

  // Clear code immediately when question ID changes (before other effects run)
  React.useEffect(() => {
    console.log(`[CodeEditor] Question ID changed to: ${question.id}`);
    // This effect just logs for now, but ensures we're notified of question changes
  }, [question.id]);

  // react to prop changes (e.g. new question or history arrives)
  React.useEffect(() => {
    const lang = initialLanguage || LANGUAGES[0].value;
    console.log(`[CodeEditor] useEffect triggered: initialCode_len=${initialCode?.length || 0}, lang=${lang}, questionId=${question.id}`);
    setLanguage(lang);
    if (initialCode !== undefined) {
      console.log('[CodeEditor] Loading initialCode into editor');
      setCode(initialCode);
    } else {
      console.log('[CodeEditor] initialCode undefined, loading template');
      setCode(getInitialCode(lang));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id, initialCode, initialLanguage]);

  const handleReset = () => {
    setCode(getInitialCode(language));
  };

  const effectiveHints = (question.hints || []).slice(0, 3);

  const handleShowHint = () => {
    if (effectiveHints.length > 0) {
      setShowHint(true);
      const used = Math.max(1, currentHintIndex + 1);
      onHintUsed?.(used);
    }
  };

  const handleNextHint = () => {
    if (currentHintIndex < effectiveHints.length - 1) {
      const nextIndex = currentHintIndex + 1;
      setCurrentHintIndex(nextIndex);
      onHintUsed?.(nextIndex + 1);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={handleLanguageChange}
            className="px-3 py-1 bg-[var(--color-input-background)] text-[var(--color-foreground)] rounded text-sm"          >
            {LANGUAGES.map(lang => (
              <option key={lang.value} value={lang.value}>{lang.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-[var(--color-muted-foreground)] capitalize">
            {keybinding} keymap
          </span>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={language === 'typescript' ? 'typescript' : language}
          value={code}
          onChange={(value) => setCode(value || '')}
          theme={theme === 'light' ? 'light' : 'vs-dark'}
          options={{
            minimap: { enabled: false },
            fontSize: parseInt(fontSize, 10),
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            padding: { top: 16, bottom: 16 },
            // keybinding placeholder - real implementation would require monaco-vim etc.
            // we simply annotate the choice visibly
          }}
        />
      </div>

      {/* Hint Section */}
      {showHint && effectiveHints.length > 0 && (
        <div className="px-4 py-3 bg-amber-500/10 border-t border-amber-500/20">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-amber-200">
                <span className="font-semibold">Hint {currentHintIndex + 1}:</span>{' '}
                {effectiveHints[currentHintIndex]}
              </p>
              <p className="text-xs text-amber-300/80 mt-1">
                XP impact: {question.difficulty === 'hard' ? 100 : question.difficulty === 'medium' ? 50 : 25} base, -20% per hint used.
              </p>
              {currentHintIndex < effectiveHints.length - 1 && (
                <button
                  onClick={handleNextHint}
                  className="text-xs text-amber-400 hover:text-amber-300 mt-1 underline"
                >
                  Show next hint
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-t border-slate-800">
        <button
          onClick={handleShowHint}
          disabled={effectiveHints.length === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm text-amber-400 hover:text-amber-300 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
        >
          <Lightbulb className="w-4 h-4" />
          Get Hint
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onRun(code, language)}
            disabled={language !== 'javascript' && language !== 'typescript'}
            title={
              language === 'javascript' || language === 'typescript'
                ? undefined
                : 'Run Code only available for JavaScript/TypeScript'
            }
            className={
              `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ` +
              (language === 'javascript' || language === 'typescript'
                ? 'bg-slate-800 hover:bg-slate-700 text-white'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed')
            }
          >
            <Play className="w-4 h-4 fill-current" />
            Run Code
          </button>
          <button
            onClick={() => onSubmit(code, language)}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <Send className="w-4 h-4" />
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};
