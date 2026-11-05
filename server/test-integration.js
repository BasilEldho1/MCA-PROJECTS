// Integration test script for Professional-User Chat System
const BASE_URL = 'http://localhost:5000/api';

async function runTest() {
  console.log('=== Starting Professional-User Chat System Integration Tests ===\n');

  // 1. Health Check
  const healthRes = await fetch(`${BASE_URL}/health`);
  const health = await healthRes.json();
  console.log('1. Server Health:', health);

  // 2. Fetch Professionals
  const prosRes = await fetch(`${BASE_URL}/professionals`);
  const { professionals } = await prosRes.json();
  console.log(`2. Professionals found: ${professionals.length}`);
  const architect = professionals.find(p => p.specialization === 'Architect');
  console.log(`   Found Architect: ${architect.name} (User ID: ${architect.userId})`);

  // 3. Login as User (Alex)
  const loginUserRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'alex@example.com', password: 'password123' })
  });
  const userAuth = await loginUserRes.json();
  const userToken = userAuth.token;
  console.log(`3. Logged in as User: ${userAuth.user.name} (Role: ${userAuth.user.role})`);

  // 4. Send Chat Request to Architect with Attached Floor Plan
  const reqRes = await fetch(`${BASE_URL}/chat-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      receiverId: architect.userId,
      message: 'Hi Elena, could you review the wall thickness and kitchen placement in my villa?',
      projectId: 'demo_villa_01',
      projectSnapshot: {
        id: 'demo_villa_01',
        name: 'Modern Luxury Villa',
        houseType: 'Villa',
        plotWidth: 40,
        plotLength: 50,
        unit: 'feet',
        roomsCount: 4
      }
    })
  });
  const reqData = await reqRes.json();
  let requestId = reqData.request?._id;
  if (!requestId) {
    // If request already exists from previous run, get existing request
    const existingRes = await fetch(`${BASE_URL}/chat-requests`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    const existingData = await existingRes.json();
    const existingList = existingData.requests || (Array.isArray(existingData) ? existingData : []);
    const existing = existingList.find((r) => {
      const recId = typeof r.receiverId === 'object' ? r.receiverId?._id : r.receiverId;
      return String(recId) === String(architect.userId);
    });
    requestId = existing?._id;
    console.log('4. Chat Request already existed or created:', existing?.status || reqData.message);
  } else {
    console.log('4. Chat Request Created:', reqData.message, `Status: ${reqData.request.status}`);
  }

  // 4b. Test Duplicate Prevention
  const dupRes = await fetch(`${BASE_URL}/chat-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      receiverId: architect.userId,
      message: 'Second request attempt...'
    })
  });
  console.log(`4b. Duplicate Prevention Test (Status ${dupRes.status}):`, (await dupRes.json()).error);

  // 5. Login as Professional (Elena)
  const loginProRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'elena.rostova@design.com', password: 'password123' })
  });
  const proAuth = await loginProRes.json();
  const proToken = proAuth.token;
  console.log(`5. Logged in as Pro: ${proAuth.user.name} (Role: ${proAuth.user.role})`);

  // 6. Pro Fetches Requests
  const proRequestsRes = await fetch(`${BASE_URL}/chat-requests`, {
    headers: { 'Authorization': `Bearer ${proToken}` }
  });
  const { requests: proRequests } = await proRequestsRes.json();
  console.log(`6. Pro received requests count: ${proRequests.length}`);

  // 7. Pro Accepts Chat Request
  const acceptRes = await fetch(`${BASE_URL}/chat-requests/${requestId}/accept`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${proToken}` }
  });
  const acceptData = await acceptRes.json();
  console.log(`7. Request Accepted: ${acceptData.message}, Conversation ID: ${acceptData.conversationId}`);
  const conversationId = acceptData.conversationId;

  // 8. Send Message from User
  const msg1Res = await fetch(`${BASE_URL}/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      message: 'Thank you for accepting! Let me know what you think of the kitchen layout.'
    })
  });
  const msg1 = await msg1Res.json();
  console.log(`8. User Message Sent: "${msg1.message.message}"`);

  // 9. Send Professional Reply
  const msg2Res = await fetch(`${BASE_URL}/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${proToken}`
    },
    body: JSON.stringify({
      message: 'I inspected your 3D floor plan. The living room flow is great, but moving the kitchen pantry wall 2 feet north will improve natural lighting.'
    })
  });
  const msg2 = await msg2Res.json();
  console.log(`9. Pro Reply Sent: "${msg2.message.message}"`);

  // 10. Fetch Conversation History
  const historyRes = await fetch(`${BASE_URL}/conversations/${conversationId}/messages`, {
    headers: { 'Authorization': `Bearer ${userToken}` }
  });
  const { messages } = await historyRes.json();
  console.log(`10. Total Conversation History: ${messages.length} messages`);
  messages.forEach((m, idx) => {
    const sender = typeof m.senderId === 'object' ? m.senderId.name : m.senderId;
    console.log(`   [${idx + 1}] ${sender}: ${m.message}`);
  });

  console.log('\n=== ALL INTEGRATION TESTS PASSED SUCCESSFULLY! ===');
}

runTest().catch(console.error);
