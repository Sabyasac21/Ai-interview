function evaluateCode(code, test_cases, language='javascript') {
  const results = [];
  if (!test_cases) return results;
  if (language !== 'javascript' && language !== 'typescript') {
    return test_cases.map(tc => ({passed:false,input:tc.input,expected:tc.expected,actual:undefined,error:`Run not supported for language ${language}`}));
  }
  // strip harness
  let cleaned = code;
  const harnessIdx = cleaned.indexOf('// Test with');
  if (harnessIdx !== -1) cleaned = cleaned.slice(0,harnessIdx);
  cleaned = cleaned.split('\n').filter(l=>!/^(\s*)(const|let|var)\s+result\b/.test(l)&&!/console\.log/.test(l)).join('\n');

  let userFn;
  try {
    const wrapper=new Function(`${cleaned};
      if(typeof solution!=='undefined') return solution;
      if(typeof solve!=='undefined') return solve;
      return null;
    `);
    userFn=wrapper();
    if(!userFn) throw new Error('no fn');
  } catch(err) {
    test_cases.forEach(tc=>results.push({passed:false,input:tc.input,expected:tc.expected,actual:undefined,error:err.message}));
    return results;
  }
  test_cases.forEach(tc=>{
    let passed=false,actual,err;
    try{actual=userFn(...(Array.isArray(tc.input)?tc.input:[tc.input]));passed=JSON.stringify(actual)===JSON.stringify(tc.expected);}catch(e){err=e.message;}
    results.push({passed,input:tc.input,expected:tc.expected,actual,error:err});
  });
  return results;
}

const tests=[
  {input:{arr:[5,2,8,1,9]},expected:[1,2,5,8,9]},
  {input:{arr:[1,2,3]},expected:[1,2,3]},
  // string-style input like legacy two-sum question
  {input:'nums=[2,7,11,15], target=9', expected:'[0,1]'},
];
console.log('no harness', evaluateCode('function solve(input){return 0;}', tests));

const harnessed = `function solve(input){return 0;}
// Test with the provided examples
const result = solve(input);
console.log(result);
`;
console.log('with harness', evaluateCode(harnessed, tests));// test code that logs and destructures
const userCode = `function solve(input) {
  console.log('input received', input);
  const { nums, target } = input;
  return nums ? [0,1] : null;
}`;
console.log('user function run', evaluateCode(userCode, tests));
console.log('python lang', evaluateCode('def solve(x): return 0', tests, 'python'));

// Test Two Sum with correct implementation
const twoSumTests = [
  {input:'nums=[2,7,11,15], target=9', expected:'[0,1]'},
  {input:'nums=[3,2,4], target=6', expected:'[1,2]'},
];

const correctTwoSum = `
function solution(input) {
  const {nums, target} = input;
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) return [map.get(complement), i];
    map.set(nums[i], i);
  }
  return [];
}
`;

console.log('\n=== Two Sum with correct logic ===');
console.log('Results:', evaluateCode(correctTwoSum, twoSumTests));
