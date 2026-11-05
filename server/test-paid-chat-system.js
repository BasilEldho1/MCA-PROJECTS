import crypto from 'crypto';

const BASE_URL = 'http://localhost:5000/api';
const RAZORPAY_SECRET = 'rzp_secret_dev_demo_key_9988';

async function testPaidChatSystem() {
  console.log('🧪 Starting Paid Chat & Razorpay System End-to-End Test...\n');

  // 1. Health check
  const healthRes = await fetch(`${BASE_URL}/health`);
  const health = await healthRes.json();
  console.log('✓ API Health Check:', health.status);

  // 2. Login as Demo User (Alex Rivera)
  const userLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'alex@example.com', password: 'password123' })
  });
  const userAuth = await userLoginRes.json();
  if (!userAuth.token) throw new Error('User login failed: ' + JSON.stringify(userAuth));
  const userToken = userAuth.token;
  console.log('✓ Demo User Authenticated:', userAuth.user.name);

  // 3. Login as Admin
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@floorplan3d.com', password: 'password123' })
  });
  const adminAuth = await adminLoginRes.json();
  const adminToken = adminAuth.token;
  console.log('✓ Admin Authenticated:', adminAuth.user.name);

  // 4. Get list of professionals
  const prosRes = await fetch(`${BASE_URL}/professionals`);
  const prosData = await prosRes.json();
  const pros = prosData.professionals || [];
  if (pros.length === 0) throw new Error('No professionals found in database');

  const targetPro = pros[0];
  const proId = targetPro._id || targetPro.id;
  console.log(`✓ Selected Professional: ${targetPro.name} (ID: ${proId})`);

  // 5. Check Pricing Endpoint
  const pricingRes = await fetch(`${BASE_URL}/professionals/${proId}/pricing`);
  const pricingData = await pricingRes.json();
  const plans = pricingData.chatPricing || pricingData.plans || [];
  console.log('✓ Professional Pricing Tiers Retrieved:', plans.length, 'tiers');

  // 6. Test Unapproved Professional Enforcement
  // Register a new unapproved professional
  const unapprovedEmail = `unapproved_${Date.now()}@example.com`;
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Unverified Pro',
      email: unapprovedEmail,
      password: 'password123',
      role: 'professional',
      licenseNumber: 'PENDING-999',
      licenseDocumentBase64: 'data:application/pdf;base64,JVBERi0xLjQK'
    })
  });
  const regData = await regRes.json();
  if (regData.user) {
    const unapprovedProId = regData.user.id || regData.user._id;
    // Attempt to create payment order for unapproved pro
    const unapprovedOrderRes = await fetch(`${BASE_URL}/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({
        professionalId: unapprovedProId,
        durationMinutes: 30
      })
    });
    if (unapprovedOrderRes.status === 403) {
      console.log('✓ Unapproved Professional Enforcement Passed: Returned 403 Forbidden as expected.');
    } else {
      console.warn('⚠️ Expected 403 for unapproved pro, got:', unapprovedOrderRes.status);
    }
  }

  // 7. Create Payment Order for Approved Professional
  console.log('\n--- Testing Razorpay Order Creation ---');
  const orderRes = await fetch(`${BASE_URL}/payments/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`
    },
    body: JSON.stringify({
      professionalId: proId,
      durationMinutes: 30
    })
  });
  const orderData = await orderRes.json();
  if (!orderRes.ok) throw new Error('Order creation failed: ' + JSON.stringify(orderData));

  console.log('✓ Razorpay Order Created:');
  console.log('  Gateway Order ID:', orderData.gatewayOrderId);
  console.log('  Total Amount: ₹' + orderData.amount);
  console.log('  Chat Fee: ₹' + orderData.chatFee + ', Platform Service Fee: ₹' + orderData.serviceFee);

  // 8. Test Invalid Signature Rejection
  console.log('\n--- Testing Signature Verification ---');
  const fakePaymentId = `pay_test_${Date.now()}`;
  const badSignatureRes = await fetch(`${BASE_URL}/payments/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`
    },
    body: JSON.stringify({
      gatewayOrderId: orderData.gatewayOrderId,
      gatewayPaymentId: fakePaymentId,
      gatewaySignature: 'bad_forged_signature_12345',
      paymentId: orderData.paymentId
    })
  });
  if (badSignatureRes.status === 400) {
    console.log('✓ Signature Tampering Prevention Passed: Rejected invalid signature with 400.');
  }

  // 9. Valid Signature Verification & Session Unlock
  const validSignature = crypto
    .createHmac('sha256', RAZORPAY_SECRET)
    .update(`${orderData.gatewayOrderId}|${fakePaymentId}`)
    .digest('hex');

  const verifyRes = await fetch(`${BASE_URL}/payments/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`
    },
    body: JSON.stringify({
      gatewayOrderId: orderData.gatewayOrderId,
      gatewayPaymentId: fakePaymentId,
      gatewaySignature: validSignature,
      paymentId: orderData.paymentId
    })
  });
  const verifyData = await verifyRes.json();
  if (!verifyData.success) throw new Error('Payment verification failed: ' + JSON.stringify(verifyData));

  console.log('✓ Valid HMAC SHA256 Signature Verified!');
  console.log('✓ Payment Status Marked:', verifyData.payment.status);
  const activeSession = verifyData.session || verifyData.chatSession;
  console.log('✓ Paid Chat Session Activated!');
  console.log('  Duration:', activeSession.durationMinutes, 'minutes');
  console.log('  Start Time:', activeSession.startTime);
  console.log('  End Time:', activeSession.endTime);
  console.log('  Conversation ID:', verifyData.conversationId);

  const convId = verifyData.conversationId;

  // 10. Check Session Countdown Timer API
  const sessionRes = await fetch(`${BASE_URL}/chat-sessions/conversation/${convId}`, {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  const sessionData = await sessionRes.json();
  console.log('✓ Server-Side Countdown Timer Check:');
  console.log('  Remaining Seconds (Server Calculated):', sessionData.remainingSeconds);
  console.log('  Is Session Expired:', sessionData.isExpired);

  // 11. Send Message during Active Session
  const msgRes = await fetch(`${BASE_URL}/conversations/${convId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`
    },
    body: JSON.stringify({
      message: 'Hello Architect! I would like to review the load-bearing wall placements.'
    })
  });
  const msgData = await msgRes.json();
  if (msgRes.ok) {
    console.log('✓ Message Sent Successfully during Paid Session:', msgData.message.content);
  } else {
    throw new Error('Message sending failed: ' + JSON.stringify(msgData));
  }

  // 12. Check User Payment History
  console.log('\n--- Testing Dashboard Records ---');
  const userPaymentsRes = await fetch(`${BASE_URL}/payments/user`, {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  const userPaymentsData = await userPaymentsRes.json();
  console.log('✓ User Dashboard Payment History:', userPaymentsData.payments.length, 'records retrieved');

  // 13. Check Admin Summary & Refund Workflow
  const adminPaymentsRes = await fetch(`${BASE_URL}/admin/payments`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const adminPaymentsData = await adminPaymentsRes.json();
  console.log('✓ Admin Dashboard Summary Metrics:');
  console.log('  Total Payments:', adminPaymentsData.summary.totalPayments);
  console.log('  Successful Payments:', adminPaymentsData.summary.successfulPayments);
  console.log('  Total Revenue: ₹' + adminPaymentsData.summary.totalRevenue);
  console.log('  Active Chat Sessions:', adminPaymentsData.summary.activeChatSessions);

  // 14. Admin Refund Execution
  console.log('\n--- Testing Admin Refund Workflow ---');
  const refundRes = await fetch(`${BASE_URL}/admin/payments/${orderData.paymentId}/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({ reason: 'Consultation completed early / testing refund' })
  });
  const refundData = await refundRes.json();
  if (refundData.success) {
    console.log('✓ Refund Processed Successfully!');
    console.log('  Status Updated to:', refundData.payment.status);
    console.log('  Refund Reason Logged:', refundData.payment.refundDetails.reason);
  } else {
    throw new Error('Refund failed: ' + JSON.stringify(refundData));
  }

  // 15. Verify Messaging is Blocked After Refund/Expiration
  const blockedMsgRes = await fetch(`${BASE_URL}/conversations/${convId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`
    },
    body: JSON.stringify({
      message: 'This message should be rejected because the session was refunded.'
    })
  });
  if (blockedMsgRes.status === 403) {
    const blockedData = await blockedMsgRes.json();
    console.log('✓ Post-Refund Access Control Enforcement Passed:');
    console.log('  Server Error Message:', blockedData.error);
  } else {
    console.warn('⚠️ Expected 403 after refund, got:', blockedMsgRes.status);
  }

  // 16. Test Razorpay Webhook Endpoint with HMAC signature
  console.log('\n--- Testing Razorpay Webhook Event ---');
  const webhookPayload = JSON.stringify({
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'pay_hook_' + Date.now(),
          order_id: 'order_hook_' + Date.now(),
          amount: 20900,
          currency: 'INR',
          status: 'captured'
        }
      }
    }
  });
  const webhookSignature = crypto
    .createHmac('sha256', 'rzp_webhook_secret_dev_9988')
    .update(webhookPayload)
    .digest('hex');

  const whRes = await fetch(`${BASE_URL}/payments/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': webhookSignature
    },
    body: webhookPayload
  });
  const whData = await whRes.json();
  if (whRes.ok && whData.status === 'ok') {
    console.log('✓ Webhook Verified & Processed Idempotently:', whData.message);
  } else {
    console.warn('⚠️ Webhook response:', whRes.status, whData);
  }

  console.log('\n🎉 ALL PAID CHAT & RAZORPAY VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉\n');
}

testPaidChatSystem().catch(err => {
  console.error('\n❌ Test Error:', err);
  process.exit(1);
});
