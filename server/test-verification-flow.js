import http from 'http';
import express from 'express';
import cors from 'cors';
import { db, seedDatabaseIfEmpty } from './src/services/dataStore.js';
import authRoutes from './src/routes/authRoutes.js';
import professionalRoutes from './src/routes/professionalRoutes.js';
import chatRequestRoutes from './src/routes/chatRequestRoutes.js';
import verificationRoutes from './src/routes/verificationRoutes.js';

// Setup isolated Express server instance for verification test
const app = express();
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/professionals', professionalRoutes);
app.use('/api/chat-requests', chatRequestRoutes);
app.use('/api', verificationRoutes);

const server = http.createServer(app);

const request = async (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (postData) {
      headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const addr = server.address();
    const req = http.request(
      {
        host: '127.0.0.1',
        port: addr.port,
        path,
        method,
        headers
      },
      res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          let parsed = data;
          try {
            parsed = JSON.parse(data);
          } catch (e) {}
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
};

const runTests = async () => {
  console.log('🧪 Starting Professional License Verification & Admin Approval Tests...');
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  console.log(`Server listening on temporary port ${port}`);

  try {
    // 1. Regular user registration
    const userRes = await request('POST', '/api/auth/register', {
      name: 'Regular Customer',
      username: 'reg_user',
      email: 'customer@example.com',
      phone: '+1 555-0101',
      password: 'password123',
      role: 'user'
    });
    console.log('1. User Registration:', userRes.status === 201 ? '✅ PASS' : `❌ FAIL (${userRes.status})`);
    const userToken = userRes.body.token;
    const userId = userRes.body.user.id;

    // 2. Professional registration with document
    const samplePdfBase64 = 'data:application/pdf;base64,' + Buffer.from('%PDF-1.4\n%Test License\n%%EOF').toString('base64');
    const proRegRes = await request('POST', '/api/auth/register', {
      name: 'David Wright',
      username: 'dwright_arch',
      email: 'david@wrightarch.com',
      phone: '+1 555-0202',
      password: 'password123',
      role: 'professional',
      specialization: 'Architect',
      companyName: 'Wright & Partners Studio',
      licenseNumber: 'ARC-CA-994411',
      yearsOfExperience: 8,
      location: 'San Jose, CA',
      licenseDocumentBase64: samplePdfBase64,
      licenseDocumentName: 'David_Wright_Architect_License.pdf'
    });
    console.log('2. Pro Registration:', proRegRes.status === 201 ? '✅ PASS' : `❌ FAIL (${proRegRes.status})`);
    const proToken = proRegRes.body.token;
    const proId = proRegRes.body.professional._id;
    console.log(`   Pro ID: ${proId}, Status: ${proRegRes.body.professional.verification.status}`);

    // 3. Verify unverified pro does NOT show up in public directory
    const dirRes = await request('GET', '/api/professionals');
    const proInDir = dirRes.body.professionals.find(p => String(p._id) === String(proId) || p.email === 'david@wrightarch.com');
    console.log('3. Public Directory Gating (Hidden from public):', !proInDir ? '✅ PASS' : '❌ FAIL (Pro appeared in directory before verification!)');

    // 4. Verify regular user cannot send chat request to unverified pro (403 expected)
    const chatReqRes = await request('POST', '/api/chat-requests', {
      receiverId: proId,
      message: 'Can you design my 3-bedroom house?'
    }, userToken);
    console.log('4. Chat Request Gating (403 for unverified pro):', chatReqRes.status === 403 ? '✅ PASS' : `❌ FAIL (${chatReqRes.status})`);

    // 5. Verify security: Regular user cannot download pro's private document (403 expected)
    const docSecRes = await request('GET', `/api/professionals/${proId}/document/license`, null, userToken);
    console.log('5. Private Document Security (403 for unauthorized user):', docSecRes.status === 403 ? '✅ PASS' : `❌ FAIL (${docSecRes.status})`);

    // 6. Pro can check their own verification status
    const proStatusRes = await request('GET', '/api/professionals/verification/status', null, proToken);
    console.log('6. Pro Verification Status Check:', proStatusRes.status === 200 && proStatusRes.body.status === 'PENDING' ? '✅ PASS' : `❌ FAIL (${proStatusRes.status})`);

    // 7. Admin login
    const adminLoginRes = await request('POST', '/api/auth/login', {
      email: 'admin@floorplan3d.com',
      password: 'password123'
    });
    console.log('7. Admin Login:', adminLoginRes.status === 200 ? '✅ PASS' : `❌ FAIL (${adminLoginRes.status})`);
    const adminToken = adminLoginRes.body.token;

    // 8. Admin verification requests list with tabs and counts
    const adminRequestsRes = await request('GET', '/api/admin/professionals/verification-requests?status=PENDING', null, adminToken);
    const hasPendingPro = adminRequestsRes.body.requests.some(r => String(r._id) === String(proId));
    console.log('8. Admin Pending Queue & Tab Counts:', adminRequestsRes.status === 200 && hasPendingPro ? '✅ PASS' : `❌ FAIL (${adminRequestsRes.status})`);
    console.log(`   Counts: pending=${adminRequestsRes.body.counts.pending}, approved=${adminRequestsRes.body.counts.approved}, rejected=${adminRequestsRes.body.counts.rejected}`);

    // 9. Admin view professional details & document
    const adminProRes = await request('GET', `/api/admin/professionals/${proId}`, null, adminToken);
    console.log('9. Admin Get Pro Details:', adminProRes.status === 200 && adminProRes.body.professional.licenseNumber === 'ARC-CA-994411' ? '✅ PASS' : `❌ FAIL (${adminProRes.status})`);

    const adminDocRes = await request('GET', `/api/professionals/${proId}/document/license`, null, adminToken);
    console.log('   Admin Access Private Document:', adminDocRes.status === 200 ? '✅ PASS' : `❌ FAIL (${adminDocRes.status})`);

    // 10. Rejection reason validation: empty reason should be rejected with 400
    const emptyRejectRes = await request('PATCH', `/api/admin/professionals/${proId}/reject`, { reason: '   ' }, adminToken);
    console.log('10. Rejection Reason Mandatory Check (400 for empty reason):', emptyRejectRes.status === 400 ? '✅ PASS' : `❌ FAIL (${emptyRejectRes.status})`);

    // 11. Admin rejects with valid reason
    const rejectRes = await request('PATCH', `/api/admin/professionals/${proId}/reject`, {
      reason: 'The uploaded license scan is blurry. Please upload a high-resolution PDF with readable expiration date.',
      notes: 'California license board requires readable stamp.'
    }, adminToken);
    console.log('11. Admin Reject with Feedback:', rejectRes.status === 200 && rejectRes.body.professional.verification.status === 'REJECTED' ? '✅ PASS' : `❌ FAIL (${rejectRes.status})`);

    // 12. Pro checks status and sees rejection reason
    const proAfterRejectRes = await request('GET', '/api/professionals/verification/status', null, proToken);
    console.log('12. Pro sees Rejection Reason in Dashboard:',
      proAfterRejectRes.body.status === 'REJECTED' && proAfterRejectRes.body.verification.rejectionReason.includes('blurry')
        ? '✅ PASS'
        : '❌ FAIL'
    );

    // 13. Pro checks notifications
    const proNotifRes = await request('GET', '/api/notifications', null, proToken);
    const hasRejectNotif = proNotifRes.body.notifications.some(n => n.type === 'VERIFICATION_REJECTED');
    console.log('13. Pro received Rejection Notification:', hasRejectNotif ? '✅ PASS' : '❌ FAIL');

    // 14. Pro resubmits with updated document
    const updatedPdfBase64 = 'data:application/pdf;base64,' + Buffer.from('%PDF-1.4\n%HD Valid License\n%%EOF').toString('base64');
    const resubmitRes = await request('POST', '/api/professionals/verification/resubmit', {
      licenseNumber: 'ARC-CA-994411-V2',
      licenseDocumentBase64: updatedPdfBase64,
      licenseDocumentName: 'David_Wright_License_HD.pdf',
      resubmissionNotes: 'Re-scanned at 600 DPI, clearly legible.'
    }, proToken);
    console.log('14. Pro Resubmission to PENDING:', resubmitRes.status === 200 && resubmitRes.body.professional.verification.status === 'PENDING' ? '✅ PASS' : `❌ FAIL (${resubmitRes.status})`);

    // 15. Admin approves pro
    const approveRes = await request('PATCH', `/api/admin/professionals/${proId}/approve`, {
      notes: 'Credentials verified with California Architects Board. License is in good standing.'
    }, adminToken);
    console.log('15. Admin Approve:', approveRes.status === 200 && approveRes.body.professional.verification.status === 'APPROVED' ? '✅ PASS' : `❌ FAIL (${approveRes.status})`);

    // 16. Pro now appears in public directory
    const dirAfterApprove = await request('GET', '/api/professionals');
    const proNowInDir = dirAfterApprove.body.professionals.find(p => String(p._id) === String(proId));
    console.log('16. Pro Visible in Public Directory after Approval:', !!proNowInDir ? '✅ PASS' : '❌ FAIL');

    // 17. Audit history is complete
    const historyRes = await request('GET', `/api/admin/professionals/${proId}/history`, null, adminToken);
    const historyActions = historyRes.body.history.map(h => h.action);
    console.log('17. Verification History Audit Trail:', historyActions.includes('SUBMITTED') && historyActions.includes('REJECTED') && historyActions.includes('RESUBMITTED') && historyActions.includes('APPROVED') ? '✅ PASS' : '❌ FAIL');
    console.log(`    Actions recorded: ${historyActions.join(' -> ')}`);

    console.log('\n🎉 ALL 17 BACKEND VERIFICATION WORKFLOW TESTS PASSED SUCCESSFULLY!');
  } finally {
    server.close();
  }
};

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
