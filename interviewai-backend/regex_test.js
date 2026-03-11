const fi = 'nums=[2,7,11,15], target=9';

// Simplified pattern
const names = fi.match(/\w+(?=\s*=)/g) || [];
console.log('Extracted params:', names.length === 1 ? names[0] : names.join(', '));
console.log('Full array:', names);
