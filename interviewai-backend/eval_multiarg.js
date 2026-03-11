// Simulates the browser evaluator with proper multi-param handling
function evaluateCode(code, test_cases, language = 'javascript') {
  const results = [];
  if (!test_cases) return results;
  
  // strip harness
  let cleaned = code;
  const harnessIdx = cleaned.indexOf('// Test with');
  if (harnessIdx !== -1) cleaned = cleaned.slice(0, harnessIdx);
  cleaned = cleaned.split('\n').filter(l => !/^(\s*)(const|let|var)\s+result\b/.test(l)).join('\n');

  let userFn;
  try {
    const wrapper = new Function(`${cleaned};
      if(typeof solution!=='undefined') return solution;
      if(typeof solve!=='undefined') return solve;
      return null;
    `);
    userFn = wrapper();
    if (!userFn) throw new Error('no fn');
  } catch (err) {
    test_cases.forEach(tc => results.push({
      passed: false,
      input: tc.input,
      expected: tc.expected,
      actual: undefined,
      error: err.message
    }));
    return results;
  }

  test_cases.forEach(tc => {
    let passed = false, actual, err, testExpected = tc.expected;
    try {
      // Parse input if string
      let testInput = tc.input;
      if (typeof testInput === 'string') {
        try {
          testInput = JSON.parse(testInput);
        } catch {
          // Parse legacy string format like "nums=[2,7,11,15], target=9"
          const names = testInput.match(/\w+(?=\s*=)/g) || [];
          testInput = {};
          names.forEach(name => {
            // Extract value for each param
            const pattern = new RegExp(name + '\\s*=\\s*(.+?)(?:,\\s*\\w+\\s*=|$)');
            const match = tc.input.match(pattern);
            if (match) {
              try {
                testInput[name] = JSON.parse(match[1]);
              } catch {
                testInput[name] = match[1];
              }
            }
          });
        }
      }

      // Parse expected if string
      if (typeof testExpected === 'string') {
        try {
          testExpected = JSON.parse(testExpected);
        } catch {}
      }

      // Run function - spread if multiple params
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
    } catch (e) {
      err = e.message;
    }
    results.push({ passed, input: tc.input, expected: testExpected, actual, error: err });
  });
  return results;
}

// Test Two Sum with multi-param signature
const twoSumTests = [
  { input: 'nums=[2,7,11,15], target=9', expected: '[0,1]' },
  { input: 'nums=[3,2,4], target=6', expected: '[1,2]' },
];

const twoSum = `
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

console.log('=== Two Sum (nums, target) ===');
const results = evaluateCode(twoSum, twoSumTests);
console.log(JSON.stringify(results, null, 2));
console.log('All passed?', results.every(r => r.passed));
