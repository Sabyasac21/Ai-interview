// Debug utility to check authentication issues
export const debugAuth = () => {
  const token = localStorage.getItem('interviewai_token');
  
  console.group('🔐 Auth Debug Info');
  console.log('Token in localStorage:', token ? '✅ EXISTS' : '❌ MISSING');
  console.log('Token length:', token?.length || 0);
  console.log('Token preview:', token ? `${token.substring(0, 20)}...` : 'N/A');
  
  if (token) {
    try {
      const parts = token.split('.');
      console.log('Token format: JWT (3 parts):', parts.length === 3 ? '✅ VALID FORMAT' : '❌ INVALID FORMAT');
      
      // Decode payload (part 2)
      const payload = JSON.parse(atob(parts[1]));
      console.log('Token payload:', payload);
      console.log('Token user_id:', payload.sub);
      
      // Check expiration
      if (payload.exp) {
        const expiryDate = new Date(payload.exp * 1000);
        const now = new Date();
        console.log('Token expiry:', expiryDate);
        console.log('Token expired:', expiryDate < now ? '❌ YES' : '✅ NO');
      }
    } catch (e) {
      console.error('Failed to parse token:', e);
    }
  } else {
    console.warn('⚠️  No token found! You may not be logged in.');
  }
  
  console.groupEnd();
};

// Test API endpoint
export const testAPIConnection = async () => {
  const token = localStorage.getItem('interviewai_token');
  
  console.group('🔗 API Connection Test');
  
  if (!token) {
    console.error('❌ No token found. Please login first.');
    console.groupEnd();
    return;
  }
  
  try {
    console.log('Testing /api/categories with token...');
    const response = await fetch('http://localhost:8000/api/categories', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Status:', response.status, response.statusText);
    console.log('Status OK:', response.ok ? '✅' : '❌');
    
    const data = await response.text();
    console.log('Response:', data ? JSON.parse(data) : 'empty');
    
    if (response.status === 401) {
      console.error('❌ 401 Unauthorized - Token is invalid or expired');
      console.warn('💡 Try logging out and logging back in');
    } else if (response.status === 200) {
      console.log('✅ API connection successful!');
    }
  } catch (error) {
    console.error('❌ API call failed:', error);
  }
  
  console.groupEnd();
};

// Export for global use
if (typeof window !== 'undefined') {
  (window as any).debugAuth = debugAuth;
  (window as any).testAPIConnection = testAPIConnection;
  console.log('🐛 Debug utilities loaded. Run: debugAuth() or testAPIConnection()');
}
