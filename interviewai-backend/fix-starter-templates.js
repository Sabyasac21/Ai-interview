// Fix all starter code templates to use consistent function names

// Python templates
const pythonTemplates = {
  dsa: `def solution(nums):
    # TODO: Implement this function
    return None`,
  
  algorithm: `def solution(input_data):
    # TODO: Implement
    return None`,
  
  system_design: `class Solution:
    def __init__(self):
        pass
    
    def solve(self, input_data):
        # TODO: Implement
        return None`,
  
  react: `import React, { useState } from 'react';

function Solution() {
  // TODO: Implement component
  return <div>Component</div>;
}

export default Solution;`,

  js: `function solution(input_data) {
    // TODO: Implement
    return null;
}`
};

// JavaScript templates
const jsTemplates = {
  dsa: `function solution(nums) {
    // TODO: Implement this function
    return null;
}`,
  
  algorithm: `function solution(input) {
    // TODO: Implement
    return null;
}`,

  system_design: `class Solution {
    constructor() {
        // TODO: Initialize
    }
    
    solve(input) {
        // TODO: Implement
        return null;
    }
}`,

  react: `function Solution() {
    // TODO: Implement component
    return <div>Component</div>;
}

export default Solution;`
};

// TypeScript templates
const tsTemplates = {
  dsa: `function solution(nums: number[]): number {
    // TODO: Implement this function
    return 0;
}`,
  
  algorithm: `function solution(input: any): any {
    // TODO: Implement
    return null;
}`,

  system_design: `class Solution {
    constructor() {
        // TODO: Initialize
    }
    
    solve(input: any): any {
        // TODO: Implement
        return null;
    }
}`
};

// Update all questions with consistent starter code
const allQuestions = db.questions.find({}).toArray();

let updated = 0;

allQuestions.forEach(q => {
  try {
    const qid = q.question_id;
    let newStarterCode = {
      python: pythonTemplates.dsa,
      javascript: jsTemplates.dsa,
      typescript: tsTemplates.dsa
    };
    
    // Determine category
    if (qid.startsWith('react-')) {
      newStarterCode = {
        javascript: jsTemplates.react,
        typescript: jsTemplates.react,
        python: pythonTemplates.react
      };
    } else if (qid.startsWith('js-')) {
      newStarterCode = {
        javascript: jsTemplates.js,
        typescript: `${jsTemplates.js}\nexport { solution };`,
        python: pythonTemplates.js
      };
    } else if (qid.startsWith('algo-')) {
      newStarterCode = {
        python: pythonTemplates.algorithm,
        javascript: jsTemplates.algorithm,
        typescript: tsTemplates.algorithm
      };
    } else if (qid.startsWith('sysdes-')) {
      newStarterCode = {
        python: pythonTemplates.system_design,
        javascript: jsTemplates.system_design,
        typescript: tsTemplates.system_design
      };
    }
    // dsa- questions default to dsa templates already set above
    
    db.questions.updateOne(
      { question_id: qid },
      { $set: { starter_code: newStarterCode }}
    );
    updated++;
  } catch (e) {
    print(`Error updating ${q.question_id}: ${e.message}`);
  }
});

print(`✅ Updated ${updated} questions with consistent starter code templates`);
print(`\nNow all functions are named 'solution' across all languages for consistency`);
print(`Total in DB: ${db.questions.countDocuments()}`);
