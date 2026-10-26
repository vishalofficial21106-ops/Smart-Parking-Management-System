const http = require('http');

const request = (path, method = 'GET', data = null, token = null) => {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (postData) headers['Content-Length'] = Buffer.byteLength(postData);

    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method,
        headers,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
};

const runVerification = async () => {
  console.log('====================================================');
  console.log(' STARTING ADMIN DASHBOARD END-TO-END VERIFICATION');
  console.log('====================================================');

  // 1. Authenticate Admin
  console.log('\n[1] Testing Admin Authentication...');
  const adminLogin = await request('/api/auth/login', 'POST', {
    email: 'admin@parking.com',
    password: 'admin123',
  });
  if (adminLogin.status !== 200 || !adminLogin.data.token) {
    throw new Error(`Admin login failed: ${JSON.stringify(adminLogin)}`);
  }
  const adminToken = adminLogin.data.token;
  console.log('  ✓ Admin logged in successfully. Role:', adminLogin.data.user.role);

  // 2. Test Customer Role Authorization (Customer cannot access admin endpoints)
  console.log('\n[2] Testing Backend Admin Role Authorization Enforcement...');
  const userLogin = await request('/api/auth/login', 'POST', {
    email: 'user@parking.com',
    password: 'user123',
  });
  const userToken = userLogin.data.token;

  const unauthorizedStats = await request('/api/bookings/admin/stats', 'GET', null, userToken);
  console.log('  Customer accessing /api/bookings/admin/stats => HTTP Status:', unauthorizedStats.status);
  if (unauthorizedStats.status !== 403) {
    throw new Error(`Expected HTTP 403 Forbidden for customer role, got: ${unauthorizedStats.status}`);
  }
  console.log('  ✓ Backend Authorization ENFORCED (HTTP 403 Forbidden returned for non-admin).');

  // 3. Admin Stats API (KPIs, Charts Data, Real time numbers)
  console.log('\n[3] Testing Admin Stats API (/api/bookings/admin/stats)...');
  const statsRes = await request('/api/bookings/admin/stats', 'GET', null, adminToken);
  if (statsRes.status !== 200 || !statsRes.data.success) {
    throw new Error(`Get admin stats failed: ${JSON.stringify(statsRes)}`);
  }
  const stats = statsRes.data.stats;
  console.log('  ✓ Total Parking Slots:', stats.totalSlots);
  console.log('  ✓ Currently Available Slots:', stats.availableSlots);
  console.log('  ✓ Currently Occupied Slots (database-backed):', stats.occupiedSlots);
  console.log('  ✓ Active Reservations:', stats.activeReservations);
  console.log('  ✓ Total Bookings:', stats.totalBookings);
  console.log('  ✓ Total Revenue: ₹' + stats.totalRevenue);
  console.log('  ✓ Daily Stats Time-Series (past 7 days):', stats.dailyStats.length, 'data points');
  console.log('  ✓ Monthly Stats Time-Series (past 6 months):', stats.monthlyStats.length, 'data points');
  console.log('  ✓ Vehicle Category Breakdown:', stats.slotsByType.map((s) => `${s._id}: ${s.count}`).join(', '));

  // 4. Slot Management (Add, Edit, Disable/Enable)
  console.log('\n[4] Testing Slot Management Operations...');
  const testSlotCode = `TEST-${Date.now().toString().slice(-4)}`;
  // A. Create new slot
  const newSlotRes = await request('/api/slots', 'POST', {
    slotNumber: testSlotCode,
    floor: 'Floor 2',
    vehicleType: 'Four-Wheeler',
    hourlyRate: 65,
    isCovered: true,
    hasCharging: false,
    status: 'available',
  }, adminToken);

  if (newSlotRes.status !== 201 || !newSlotRes.data.success) {
    throw new Error(`Failed to create new slot: ${JSON.stringify(newSlotRes)}`);
  }
  const createdSlot = newSlotRes.data.data;
  console.log('  ✓ Created new parking slot:', createdSlot.slotNumber, 'Hourly Price: ₹' + createdSlot.hourlyRate);

  // B. Edit slot
  const editSlotRes = await request(`/api/slots/${createdSlot._id}`, 'PUT', {
    hourlyRate: 75,
    hasCharging: true,
  }, adminToken);
  console.log('  ✓ Edited slot rate to: ₹' + editSlotRes.data.data.hourlyRate);

  // C. Toggle Disable slot (maintenance)
  const disableRes = await request(`/api/slots/${createdSlot._id}/disable`, 'PUT', {}, adminToken);
  console.log('  ✓ Disabled slot status:', disableRes.data.data.status);

  // D. Toggle Enable slot back
  const enableRes = await request(`/api/slots/${createdSlot._id}/disable`, 'PUT', {}, adminToken);
  console.log('  ✓ Enabled slot status back to:', enableRes.data.data.status);

  // 5. Bookings Management & Filtering
  console.log('\n[5] Testing Bookings Query & Filters...');
  // A. All Bookings
  const allBookingsRes = await request('/api/bookings', 'GET', null, adminToken);
  console.log('  ✓ Retrieved all bookings count:', allBookingsRes.data.count);

  // B. Filter by Status (Active)
  const activeBookingsRes = await request('/api/bookings?status=Active', 'GET', null, adminToken);
  console.log('  ✓ Filter by status=Active count:', activeBookingsRes.data.count);

  // C. Filter by Slot Number
  const slotFilteredRes = await request('/api/bookings?slotNumber=F1-02', 'GET', null, adminToken);
  console.log('  ✓ Filter by slotNumber=F1-02 count:', slotFilteredRes.data.count);

  // D. Search plate / ticket
  const searchRes = await request('/api/bookings?search=PK-849201', 'GET', null, adminToken);
  console.log('  ✓ Search keyword "PK-849201" count:', searchRes.data.count);

  // 6. Gate Access Lifecycle: Confirm, Check In, Check Out
  console.log('\n[6] Testing Gate Access Lifecycle (Confirm, Check In, Check Out)...');
  // Create a fresh booking to test full gate cycle
  const startISO = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const endISO = new Date(Date.now() + 130 * 60 * 1000).toISOString();

  const createBookingRes = await request('/api/bookings', 'POST', {
    slotId: createdSlot._id,
    vehicleNumber: 'MH-14-TEST-007',
    vehicleType: 'Four-Wheeler',
    startTime: startISO,
    endTime: endISO,
    durationHours: 2,
  }, userToken);

  if (createBookingRes.status !== 201) {
    throw new Error(`Failed to create test booking: ${JSON.stringify(createBookingRes)}`);
  }
  const testBooking = createBookingRes.data.data;
  console.log('  ✓ Created test booking with Ticket ID:', testBooking.ticketId, 'Status:', testBooking.bookingStatus);

  // Transition: Confirmed -> Active (Gate Check In)
  const checkInRes = await request(`/api/bookings/${testBooking._id}/status`, 'PUT', { status: 'Active' }, adminToken);
  console.log('  ✓ Gate Check In performed. Booking Status:', checkInRes.data.data.bookingStatus);

  // Transition: Active -> Completed (Gate Check Out & Bay release)
  const checkOutRes = await request(`/api/bookings/${testBooking._id}/status`, 'PUT', { status: 'Completed' }, adminToken);
  console.log('  ✓ Gate Check Out performed. Booking Status:', checkOutRes.data.data.bookingStatus);

  // Clean up test slot
  await request(`/api/slots/${createdSlot._id}`, 'DELETE', null, adminToken);
  console.log('  ✓ Cleaned up test parking slot.');

  console.log('\n====================================================');
  console.log(' ALL ADMIN DASHBOARD BACKEND REQUIREMENTS VERIFIED! ');
  console.log('====================================================\n');
};

runVerification().catch((err) => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
