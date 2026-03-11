function getDSATemplate(language, questionTitle, params='input'){
  const templates = {
    javascript: `// Solution for: ${questionTitle}
// TODO: Implement your solution here

function solve(${params}) {
  // Write your code here
  
  return result;
}

// Test with the provided examples
const result = solve(${params});
console.log(result);`,
  };
  return templates[language] || '';
}

console.log(getDSATemplate('javascript','Bubble Sort','arr'));
