const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/auth';

async function testLogin() {
  console.log('🔍 Testing Login...');
  
  try {
    // Test successful login
    const response = await axios.post(`${BASE_URL}/login`, {
      email: 'customer@lego.com',
      password: '123456'
    });
    
    console.log('✅ Login successful:', response.data.message);
    console.log('Token:', response.data.token ? 'Generated' : 'Not generated');
    console.log('User:', response.data.user.name, '-', response.data.user.role);
    
    return response.data.token;
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testFailedLogin() {
  console.log('\n🔍 Testing Failed Login...');
  
  try {
    await axios.post(`${BASE_URL}/login`, {
      email: 'customer@lego.com',
      password: 'wrongpassword'
    });
  } catch (error) {
    console.log('✅ Failed login handled correctly:', error.response?.data?.message);
    console.log('Attempts remaining:', error.response?.data?.attemptsRemaining);
  }
}

async function testRegister() {
  console.log('\n🔍 Testing Register...');
  
  try {
    const response = await axios.post(`${BASE_URL}/register`, {
      name: 'Test User',
      email: 'test@example.com',
      password: 'testpass123',
      phone: '+84123456789'
    });
    
    console.log('✅ Registration successful:', response.data.message);
    console.log('User:', response.data.user.name);
    
    return response.data.token;
  } catch (error) {
    console.log('❌ Registration failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testForgotPassword() {
  console.log('\n🔍 Testing Forgot Password...');
  
  try {
    const response = await axios.post(`${BASE_URL}/forgot-password`, {
      email: 'customer@lego.com'
    });
    
    console.log('✅ Password reset requested:', response.data.message);
    if (response.data.resetToken) {
      console.log('Reset token generated (for testing)');
      return response.data.resetToken;
    }
  } catch (error) {
    console.log('❌ Forgot password failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testGetMe(token) {
  console.log('\n🔍 Testing Get Me (Protected Route)...');
  
  try {
    const response = await axios.get(`${BASE_URL}/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('✅ Protected route access successful');
    console.log('User data retrieved:', response.data.user.name);
  } catch (error) {
    console.log('❌ Protected route failed:', error.response?.data?.message || error.message);
  }
}

async function testMultipleFailedLogins() {
  console.log('\n🔍 Testing Account Lock (Multiple Failed Logins)...');
  
  for (let i = 1; i <= 6; i++) {
    try {
      await axios.post(`${BASE_URL}/login`, {
        email: 'seller@lego.com',
        password: 'wrongpassword'
      });
    } catch (error) {
      console.log(`Attempt ${i}:`, error.response?.data?.message);
      if (error.response?.status === 423) {
        console.log('🔒 Account locked successfully!');
        break;
      }
    }
  }
}

async function runAllTests() {
  console.log('🚀 Starting Authentication Tests...\n');
  
  try {
    // Test basic login
    const token = await testLogin();
    
    // Test protected route
    if (token) {
      await testGetMe(token);
    }
    
    // Test failed login
    await testFailedLogin();
    
    // Test registration
    await testRegister();
    
    // Test forgot password
    await testForgotPassword();
    
    // Test account locking
    await testMultipleFailedLogins();
    
    console.log('\n✅ All authentication tests completed!');
    
  } catch (error) {
    console.error('❌ Test suite error:', error.message);
  }
  
  process.exit(0);
}

// Run tests
runAllTests();
