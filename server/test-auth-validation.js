// Automated Validation Test for Registration, Login, and Database Persistence
const BASE_URL = 'http://localhost:5000/api';

async function runAuthTests() {
  console.log('🧪 Starting Auth Validation & Database Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // TEST 1: Register validation - missing name
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', email: 'test@example.com', password: 'password123' })
    });
    const data = await res.json();
    assert(res.status === 400 && data.error.includes('Full name is required'), 'Registration rejects empty name with 400');
  } catch (e) {
    assert(false, 'Test 1 exception: ' + e.message);
  }

  // TEST 2: Register validation - invalid email format
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Valid Name', email: 'invalid-email-format', password: 'password123' })
    });
    const data = await res.json();
    assert(res.status === 400 && data.error.includes('valid email address'), 'Registration rejects invalid email format with 400');
  } catch (e) {
    assert(false, 'Test 2 exception: ' + e.message);
  }

  // TEST 3: Register validation - password too short
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Valid Name', email: 'shortpw@example.com', password: '123' })
    });
    const data = await res.json();
    assert(res.status === 400 && data.error.includes('at least 6 characters'), 'Registration rejects password < 6 chars with 400');
  } catch (e) {
    assert(false, 'Test 3 exception: ' + e.message);
  }

  // TEST 4: Register validation - mismatched confirmPassword
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Valid Name',
        email: 'mismatch@example.com',
        password: 'password123',
        confirmPassword: 'differentPassword456'
      })
    });
    const data = await res.json();
    assert(res.status === 400 && data.error.includes('Passwords do not match'), 'Registration rejects mismatched passwords with 400');
  } catch (e) {
    assert(false, 'Test 4 exception: ' + e.message);
  }

  // TEST 5: Successful user registration & database creation
  const uniqueEmail = `testuser_${Date.now()}@teststudio.com`;
  let registeredToken = null;
  let registeredUserId = null;
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Carlos Mendez',
        username: `carlos_${Date.now()}`,
        email: uniqueEmail,
        password: 'SuperSecret2026!',
        confirmPassword: 'SuperSecret2026!',
        role: 'user'
      })
    });
    const data = await res.json();
    registeredToken = data.token;
    registeredUserId = data.user?.id || data.user?._id;
    assert(
      res.status === 201 && data.token && data.user.email === uniqueEmail,
      'Registration creates user in database and returns 201 + token'
    );
  } catch (e) {
    assert(false, 'Test 5 exception: ' + e.message);
  }

  // TEST 6: Register duplicate email prevention
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Carlos Clone',
        email: uniqueEmail,
        password: 'AnotherPassword123'
      })
    });
    const data = await res.json();
    assert(
      res.status === 409 && data.error.includes('already exists'),
      'Registration rejects duplicate email with 409 Conflict'
    );
  } catch (e) {
    assert(false, 'Test 6 exception: ' + e.message);
  }

  // TEST 7: Login validation - missing email or password
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '', password: '' })
    });
    const data = await res.json();
    assert(res.status === 400 && data.error.includes('Email address is required'), 'Login rejects empty email with 400');
  } catch (e) {
    assert(false, 'Test 7 exception: ' + e.message);
  }

  // TEST 8: Login validation - non-existent user
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ghost_user_999999@test.com', password: 'password123' })
    });
    const data = await res.json();
    assert(res.status === 401 && data.error === 'Invalid email or password.', 'Login rejects non-existent user with 401');
  } catch (e) {
    assert(false, 'Test 8 exception: ' + e.message);
  }

  // TEST 9: Login validation - wrong password
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: uniqueEmail, password: 'WrongPassword999!' })
    });
    const data = await res.json();
    assert(res.status === 401 && data.error === 'Invalid email or password.', 'Login rejects incorrect password with 401');
  } catch (e) {
    assert(false, 'Test 9 exception: ' + e.message);
  }

  // TEST 10: Successful login with correct credentials
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: uniqueEmail, password: 'SuperSecret2026!' })
    });
    const data = await res.json();
    assert(
      res.status === 200 && data.token && data.user.email === uniqueEmail && data.message === 'Login successful.',
      'Login authenticates correct password and returns 200 + token'
    );
  } catch (e) {
    assert(false, 'Test 10 exception: ' + e.message);
  }

  // TEST 11: Authenticated /me endpoint validation
  try {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${registeredToken}` }
    });
    const data = await res.json();
    assert(
      res.status === 200 && data.user.email === uniqueEmail,
      'Auth token validates successfully on /api/auth/me'
    );
  } catch (e) {
    assert(false, 'Test 11 exception: ' + e.message);
  }

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runAuthTests();
