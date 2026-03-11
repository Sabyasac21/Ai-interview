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
  cleaned = cleaned.split('\n').filter(l=>!/^(\s*)(const|let|var)\s+result\b/.test(l)).join('\n');

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
    let passed=false,actual,err,testExpected=tc.expected;
    try{
      // Parse input if string
      let testInput=tc.input;
      if(typeof testInput==='string'){
        try{testInput=JSON.parse(testInput);}
        catch{
          const numsMatch=testInput.match(/nums\s*=\s*\[([^\]]+)\]/);
          const targetMatch=testInput.match(/target\s*=\s*(-?\d+)/);
          if(numsMatch){
            const arr=numsMatch[1].split(',').map(x=>Number(x.trim())).filter(x=>!isNaN(x));
            testInput={nums:arr};
            if(targetMatch) testInput.target=Number(targetMatch[1]);
          }
        }
      }
      // Parse expected if string
      if(typeof testExpected==='string'){
        try{testExpected=JSON.parse(testExpected);}
        catch{}
      }
      // Run function
      if (Array.isArray(testInput)) {
        actual = userFn(...testInput);
      } else if (typeof testInput === 'object') {
        if (userFn.length > 1) {
          actual = userFn(...Object.values(testInput));
        } else {
          actual = userFn(testInput);
        }
      } else {
        actual = userFn(testInput);
      }
      passed = JSON.stringify(actual) === JSON.stringify(testExpected);
    }catch(e){err=e.message;}
    results.push({passed,input:tc.input,expected:testExpected,actual,error:err});
  });
  return results;
}

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

console.log('=== Two Sum with correct logic (expected as string, should parse and pass) ===');
console.log(JSON.stringify(evaluateCode(correctTwoSum, twoSumTests), null, 2));

// Additional test with explicit params
const twoParam = `
function solution(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) return [map.get(complement), i];
    map.set(nums[i], i);
  }
  return [];
}
`;
console.log('\n=== Two Param Signature ===');
console.log(JSON.stringify(evaluateCode(twoParam, twoSumTests), null, 2));
