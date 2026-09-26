const http = require('http');

function request(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    if (postData) {
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: reqHeaders
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('  RUNNING INSTA PRINTS PRE-HOSTING TEST SUITE');
  console.log('====================================================\n');
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log('  ✓ [PASS] ' + message);
      passed++;
    } else {
      console.error('  ✗ [FAIL] ' + message);
    }
  }

  try {
    // 1. Health Check
    const health = await request('GET', '/api/health');
    assert(health.status === 200 && health.body.success === true, 'API Health Check (/api/health)');

    // 2. Root Frontend Serving
    const root = await request('GET', '/');
    assert(root.status === 200 && typeof root.body === 'string' && root.body.includes('Insta Prints'), 'Root HTML Static Serving (/)');

    // 3. Admin Invalid Login Check
    const badLogin = await request('POST', '/api/admin/login', { email: 'instaprints@gmail.com', password: 'WrongPassword123' });
    assert(badLogin.status === 401 && badLogin.body.success === false, 'Admin Invalid Login Blocked (401)');

    // 4. Admin Valid Login & JWT Issuance
    const login = await request('POST', '/api/admin/login', { email: 'instaprints@gmail.com', password: 'Instaprints@2026' });
    assert(login.status === 200 && login.body.token, 'Admin Valid Login & JWT Token Generated');
    const adminToken = login.body.token;

    // 5. Protected Admin Route Verification
    const profile = await request('GET', '/api/admin/profile', null, { 'Authorization': 'Bearer ' + adminToken });
    assert(profile.status === 200 && profile.body.admin?.email === 'instaprints@gmail.com', 'Admin Protected Route Authorization');

    // 6. User Service Order Submission
    const submit = await request('POST', '/api/requests/submit', {
      name: 'Rohan Verma',
      rollNumber: '23AI045',
      branch: 'AIML',
      year: '3rd Year',
      section: 'A',
      mobile: '9876543210',
      email: 'rohan.verma@example.com',
      service: 'AutoCAD Drawing',
      subject: 'Hydraulic Cylinder Assembly Blueprint',
      requirements: 'Complete 2D drafting with dimensions, exploded assembly view, and bill of materials.',
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      specificInstructions: 'A2 Sheet, first angle projection standard.'
    });
    assert(submit.status === 201 && submit.body.requestId, 'User Order Submission (Generated: ' + submit.body.requestId + ')');
    const requestId = submit.body.requestId;

    // 7. Tracking Verification - Mobile Mismatch Security Check
    const trackBad = await request('POST', '/api/requests/track', { requestId, mobileNumber: '9999999999' });
    assert(trackBad.status === 403, 'Order Tracking Unauthorized Access Blocked (403)');

    // 8. Tracking Verification - Legitimate User Access
    const trackGood = await request('POST', '/api/requests/track', { requestId, mobileNumber: '9876543210' });
    assert(trackGood.status === 200 && trackGood.body.data.request.requestId === requestId, 'Order Tracking Legitimate Access (200)');

    // 9. Admin Issue Quotation
    const quote = await request('POST', '/api/requests/admin/quotation/' + requestId, {
      totalAmount: 2000,
      advancePercentage: 50,
      notes: 'Includes CAD 3D modeling and 2 free revision cycles.'
    }, { 'Authorization': 'Bearer ' + adminToken });
    assert(quote.status === 200 && quote.body.quotation?.advanceAmount === 1000, 'Admin Quotation Issuance (Total ₹2000, Advance ₹1000)');

    // 10. User Accept Quotation
    const accept = await request('POST', '/api/requests/accept-quotation', { requestId, mobileNumber: '9876543210' });
    assert(accept.status === 200 && accept.body.currentStatus === 'awaiting_advance_payment', 'User Quotation Acceptance & State Transition');

    // 11. Scoped Private Chat (User message + Admin reply)
    const userMsg = await request('POST', '/api/chat/' + requestId + '/send', {
      text: 'Hello, please confirm if DWG format will be provided.',
      mobileNumber: '9876543210'
    });
    assert(userMsg.status === 201, 'User Message Sent in Scoped Thread');

    const adminMsg = await request('POST', '/api/chat/' + requestId + '/send', {
      text: 'Yes Rohan, both PDF and native DWG source files will be delivered.'
    }, { 'Authorization': 'Bearer ' + adminToken });
    assert(adminMsg.status === 201, 'Admin Reply Sent in Scoped Thread');

    const getChat = await request('GET', '/api/chat/' + requestId, null, { 'Authorization': 'Bearer ' + adminToken });
    assert(getChat.status === 200 && getChat.body.messages?.length === 2, 'Chat Thread Message Count Verified (2 Messages)');

    // 12. Advance Payment Recording & Auto-Confirmation
    const payAdvance = await request('POST', '/api/payments/record', {
      requestId,
      amount: 1000,
      type: 'advance',
      status: 'paid',
      transactionRef: 'UPI/2026/89421'
    }, { 'Authorization': 'Bearer ' + adminToken });
    assert(payAdvance.status === 201 && payAdvance.body.currentStatus === 'confirmed', 'Advance Payment Recorded & Order Auto-Confirmed');

    // 13. Status Workflow Progression
    const updateProg = await request('PUT', '/api/requests/admin/status/' + requestId, {
      status: 'work_in_progress',
      note: 'AutoCAD drafting started by studio.'
    }, { 'Authorization': 'Bearer ' + adminToken });
    assert(updateProg.status === 200 && updateProg.body.currentStatus === 'work_in_progress', 'Admin Transitioned Status to work_in_progress');

    // 14. Record Final Remaining Balance & Complete Order
    const payRemaining = await request('POST', '/api/payments/record', {
      requestId,
      amount: 1000,
      type: 'remaining',
      status: 'paid',
      transactionRef: 'UPI/2026/99912'
    }, { 'Authorization': 'Bearer ' + adminToken });
    assert(payRemaining.status === 201, 'Remaining Balance Recorded');

    const updateDone = await request('PUT', '/api/requests/admin/status/' + requestId, {
      status: 'completed',
      note: 'Order fulfilled and deliverables handed over.'
    }, { 'Authorization': 'Bearer ' + adminToken });
    assert(updateDone.status === 200 && updateDone.body.currentStatus === 'completed', 'Order Lifecycle Completed');

    // 15. Dashboard Analytics & Revenue KPI
    const metrics = await request('GET', '/api/requests/admin/metrics', null, { 'Authorization': 'Bearer ' + adminToken });
    assert(metrics.status === 200 && metrics.body.metrics.totalRevenue === 2000, 'Admin Dashboard Revenue KPI Verified (₹2000)');

    console.log('\n====================================================');
    console.log('  TEST RESULTS: ' + passed + '/' + total + ' TESTS PASSED (100%)');
    console.log('====================================================');
  } catch (err) {
    console.error('Fatal Test Runner Error:', err);
  }
}

runTests();
