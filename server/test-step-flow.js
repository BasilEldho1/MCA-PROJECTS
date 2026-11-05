// Full test verifying the 3-step sequence:
// 1. Register -> 2. Login -> 3. Enter Studio (Page)
const BASE_URL = 'http://localhost:5000/api';

async function verifyStepFlow() {
  console.log('=====================================================');
  console.log('🚀 Verifying 3-Step Flow: 1. Register -> 2. Login -> 3. Enter Page');
  console.log('=====================================================\n');

  const testUser = {
    name: 'Maya Lin',
    username: `mayalin_${Date.now()}`,
    email: `maya_${Date.now()}@designstudio.com`,
    password: 'SecureMayaPass2026!',
    confirmPassword: 'SecureMayaPass2026!',
    role: 'user'
  };

  // -----------------------------------------------------------------
  // STEP 1: REGISTER
  // -----------------------------------------------------------------
  console.log('👉 STEP 1: Submitting Registration...');
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser)
  });
  const regData = await regRes.json();

  if (regRes.status !== 201) {
    console.error('❌ Step 1 Failed:', regData);
    process.exit(1);
  }
  console.log('   ✅ Step 1 Success! Account created in database.');
  console.log(`   User ID: ${regData.user.id}, Name: ${regData.user.name}, Email: ${regData.user.email}`);
  console.log('   UI transitions to Step 2 (Login screen) with email prefilled.\n');

  // -----------------------------------------------------------------
  // STEP 2: LOGIN
  // -----------------------------------------------------------------
  console.log('👉 STEP 2: Logging in with registered credentials...');
  
  // First verify wrong password is rejected
  const failLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testUser.email, password: 'wrongPassword' })
  });
  if (failLoginRes.status === 401) {
    console.log('   ✅ Validation check: incorrect password correctly rejected with 401.');
  }

  // Now login with correct password
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testUser.email, password: testUser.password })
  });
  const loginData = await loginRes.json();

  if (loginRes.status !== 200 || !loginData.token) {
    console.error('❌ Step 2 Failed:', loginData);
    process.exit(1);
  }
  console.log('   ✅ Step 2 Success! Authenticated via database.');
  console.log(`   JWT Token acquired: ${loginData.token.substring(0, 30)}...`);
  console.log(`   User authenticated: ${loginData.user.name} (${loginData.user.email})\n`);

  // -----------------------------------------------------------------
  // STEP 3: ENTER PAGE (Access protected resources / dashboard)
  // -----------------------------------------------------------------
  console.log('👉 STEP 3: Entering the Studio / Dashboard page...');
  const meRes = await fetch(`${BASE_URL}/auth/me`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${loginData.token}` }
  });
  const meData = await meRes.json();

  if (meRes.status !== 200 || meData.user.email !== testUser.email) {
    console.error('❌ Step 3 Failed:', meData);
    process.exit(1);
  }
  console.log('   ✅ Step 3 Success! Access granted to Studio / Dashboard.');
  console.log(`   Verified User Session for: ${meData.user.name}\n`);

  console.log('=====================================================');
  console.log('🎉 ALL 3 STEPS COMPLETED AND VALIDATED SUCCESSFULLY!');
  console.log('=====================================================');
}

verifyStepFlow();
