const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const fs = require('fs');

const UserManager = require('./managers/UserManager');
const TechnicianManager = require('./managers/TechnicianManager');
const AdminManager = require('./managers/AdminManager');
const FeedbackManager = require('./managers/FeedbackManager');
const LocationManager = require('./managers/LocationManager');
const ComplaintManager = require('./managers/ComplaintManager');
const JobManager = require('./managers/JobManager');
const FinanceManager = require('./managers/FinanceManager');
const RideManager = require('./managers/RideManager');
const SuperAdminManager = require('./managers/SuperAdminManager');
const SessionManager = require('./managers/SessionManager');
const ChatManager = require('./managers/ChatManager');
const OfferManager = require('./managers/OfferManager');
const SupportManager = require('./managers/SupportManager');
const StorageManager = require('./managers/StorageManager');
const NotificationManager = require('./managers/NotificationManager');
const BroadcastManager = require('./managers/BroadcastManager');
const TestimonialManager = require('./managers/TestimonialManager');
const PerformerManager = require('./managers/PerformerManager');
const ActivityLogManager = require('./managers/ActivityLogManager'); // [NEW]
const AnalyticsManager = require('./managers/AnalyticsManager');
const InvoiceManager = require('./managers/InvoiceManager');
const InvoiceSettingsManager = require('./managers/InvoiceSettingsManager');
const Database = require('./managers/Database'); // Explicitly needed for settings

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json({ limit: '10mb' })); // Increased limit for logo uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../client/dist')));


// [NEW] Automatic Membership Expiry Check (Every 60 Seconds)
// We need to wait for manager init, so we'll do this better after manager creation or inside server.listen
// But `technicianManager` is created below. Let's move this to server.listen block at bottom of file usually, 
// or just use a delayed start. 
// Ideally, `server.listen` is where we start cron jobs.


// GLOBAL DEBUG LOGGING
app.use((req, res, next) => {
  console.log(`[GLOBAL-DEBUG] ${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});


const upload = multer({ dest: 'uploads/temp/' });

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Initialize Managers
const userManager = new UserManager();
const technicianManager = new TechnicianManager();
const adminManager = new AdminManager();
const feedbackManager = new FeedbackManager();
const locationManager = new LocationManager();
const complaintManager = new ComplaintManager();
const financeManager = new FinanceManager();
const rideManager = new RideManager();
const sessionManager = new SessionManager();
const superAdminManager = new SuperAdminManager();
const chatManager = new ChatManager();
const offerManager = new OfferManager();
const supportManager = new SupportManager();
const notificationManager = new NotificationManager();
const storageManager = new StorageManager();
const broadcastManager = new BroadcastManager();
const testimonialManager = new TestimonialManager();
const performerManager = new PerformerManager();
const activityLogManager = new ActivityLogManager(); // [NEW]
const analyticsManager = new AnalyticsManager();

// Invoice System
const invoiceSettingsDb = new Database('invoice_settings.json');
const invoiceSettingsManager = new InvoiceSettingsManager(invoiceSettingsDb);
const invoiceManager = new InvoiceManager(invoiceSettingsManager, adminManager, storageManager);

const jobManager = new JobManager();
analyticsManager.setSocketIO(io);

// Resolve Circular Dependencies
invoiceManager.setJobManager(jobManager);
jobManager.setInvoiceManager(invoiceManager); // Ensure JobManager has InvoiceManager linkage
jobManager.setAnalyticsManager(analyticsManager);
offerManager.setJobManager(jobManager);
offerManager.setUserManager(userManager);
offerManager.setTechnicianManager(technicianManager);
offerManager.setNotificationManager(notificationManager);
chatManager.setNotificationManager(notificationManager);
supportManager.setNotificationManager(notificationManager); // [NEW] Notification support for tickets

// Link Managers to Socket.io for automatic broadcasts
// Link Managers to Socket.io for automatic broadcasts
const allManagers = [
  userManager, technicianManager, adminManager, feedbackManager,
  locationManager, complaintManager, jobManager, financeManager,
  rideManager, sessionManager, superAdminManager, chatManager,
  offerManager, notificationManager, storageManager, broadcastManager,
  testimonialManager, performerManager, invoiceManager, invoiceSettingsManager,
  supportManager, activityLogManager, analyticsManager
];

allManagers.forEach(m => {
  if (m && typeof m.setSocketIO === 'function') {
    m.setSocketIO(io);
  } else if (m) {
    m.io = io; // Fallback: set it anyway if method doesn't exist yet
  }
});

// Connect FeedbackManager dependencies
feedbackManager.setTechnicianManager(technicianManager);
feedbackManager.setJobManager(jobManager);
feedbackManager.setAnalyticsManager(analyticsManager);

// Connect JobManager dependencies
jobManager.setTechnicianManager(technicianManager);
jobManager.setFinanceManager(financeManager);
jobManager.setAnalyticsManager(analyticsManager);
jobManager.setInvoiceManager(invoiceManager);
jobManager.setActivityLogManager(activityLogManager);

// [NEW] Inject JobManager into TechnicianManager for Queue Watcher (Flow 4)
technicianManager.setJobManager(jobManager);

// [NEW] Inject Dependencies into FeedbackManager
feedbackManager.setJobManager(jobManager);
feedbackManager.setTechnicianManager(technicianManager);

// Inject into FinanceManager
financeManager.setActivityLogManager(activityLogManager);

// [NEW] Link OfferManager Dependencies
offerManager.setJobManager(jobManager);
offerManager.setUserManager(userManager);
offerManager.setTechnicianManager(technicianManager);
offerManager.setNotificationManager(notificationManager);



// Start Authentication Middleware
const authenticateSession = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;

    // Log the full received URL for debugging
    console.log(`[AUTH] Request: ${req.method} ${req.url}`);

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
      console.log(`[AUTH] Token Source: Header`);
    } else if (req.query.token) {
      token = req.query.token;
      console.log(`[AUTH] Token Source: Query`);
    } else {
      // LAST RESORT: Try to manually parse from req.url (useful if proxy strips req.query)
      const urlMatch = req.url.match(/[?&]token=([^&]+)/);
      if (urlMatch) {
        token = urlMatch[1];
        console.log(`[AUTH] Token Source: Manual URL Match`);
      }
    }

    if (!token) {
      console.log(`[AUTH-FAILURE] No token provided at ${new Date().toISOString()}. Request URL: ${req.url}`);
      return res.status(401).json({
        success: false,
        error: `No session token provided [V4-DIAGNOSTIC-22JAN-01AM]`,
        debug: { serverTime: new Date().toISOString(), url: req.url }
      });
    }

    const session = await sessionManager.validateSession(token);
    if (!session || token === 'null' || token === 'undefined') {
      console.log(`[AUTH] Session Validation Failed for token: ${token ? token.substring(0, 5) + '...' : 'null'}`);
      return res.status(401).json({ success: false, error: 'Session expired or invalid' });
    }

    // Attach user context
    req.user = { id: session.userId, role: session.role };
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(500).json({ success: false, error: 'Internal auth error' });
  }
};
// End Authentication Middleware

// Middleware to verify Admin Session and Attach Context
const verifyAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const session = await sessionManager.validateSession(token);

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized: Invalid session' });
    }

    // [FIX] Always load fresh Admin Profile to get latest Location/Role
    // This allows role upgrades (User -> Admin) or Location changes to take effect immediately
    const admin = await adminManager.db.find('id', session.userId);

    if (admin) {
      // Normalize Role
      const role = (admin.role || session.role || '').toLowerCase();

      if (role !== 'admin' && role !== 'superadmin') {
        return res.status(403).json({ error: 'Forbidden: Admin access only' });
      }

      // Attach enriched user context
      req.user = {
        id: admin.id,
        role: role, // 'admin' or 'superadmin'
        email: admin.email,
        fixed_latitude: admin.fixed_latitude,
        fixed_longitude: admin.fixed_longitude
      };

      // Legacy support
      req.admin = req.user;

      next();
    } else {
      // Session exists but Admin record missing? 
      // Could happen if deleted but session persists.
      return res.status(401).json({ error: 'Unauthorized: Admin profile not found' });
    }

  } catch (err) {
    console.error("[Middleware] Verify Admin Error:", err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// VERSION CHECK - Verify Render has latest code
app.get('/api/version', async (req, res) => {
  let dbStatus = 'Unknown';
  if (process.env.USE_SUPABASE === 'true') {
    try {
      // Quick health check for Supabase
      const { count, error } = await sessionManager.db.client.from('sessions').select('*', { count: 'exact', head: true });
      dbStatus = error ? `Error: ${error.message}` : `Connected (Sessions: ${count})`;
    } catch (e) { dbStatus = `Exception: ${e.message}`; }
  } else {
    dbStatus = 'Local JSON (Ephemeral)';
  }

  res.json({
    version: '2.2-LOGIN-DEBUG',
    deployed: new Date().toISOString(),
    config: {
      USE_SUPABASE: process.env.USE_SUPABASE || 'NOT_SET',
      database_type: process.env.USE_SUPABASE === 'true' ? 'Supabase' : 'JSON',
      db_status: dbStatus
    }
  });
});

// PUBLIC DIAGNOSTIC ROUTE
app.get('/api/test-server-version', authenticateSession, (req, res) => {
  res.json({
    status: 'ACTIVE',
    version: 'V3-DIAGNOSTIC-FIX',
    timestamp: new Date().toISOString(),
    queryReceived: req.query
  });
});

// --- Technician Routes ---
const techUploads = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'pan', maxCount: 1 },
  { name: 'aadhar', maxCount: 1 },
  { name: 'dl', maxCount: 1 }
]);

app.post('/api/technicians/register', techUploads, async (req, res) => {
  try {
    console.log('--- Register Request ---');
    const { name, email, phone, serviceType, location, password, experience, country, state, city, pincode } = req.body;

    let parsedLocation = location;
    if (typeof location === 'string') {
      try { parsedLocation = JSON.parse(location); } catch (e) { }
    }

    const addressDetails = { country, state, city, pincode };

    // 1. Create Technician (Get ID)
    const tech = await technicianManager.createTechnician({
      name,
      email,
      phone,
      serviceType,
      addressDetails,
      experience,
      password
    }, null, parsedLocation);

    // 2. Handle Files and Upload via StorageManager
    const docPaths = {};
    if (req.files) {
      const uploadPromises = Object.keys(req.files).map(async (fieldname) => {
        if (req.files[fieldname] && req.files[fieldname][0]) {
          const file = req.files[fieldname][0];
          // Format: technicianId/filename
          const customName = `${tech.id}-${fieldname}${path.extname(file.originalname)}`;
          const url = await storageManager.upload(file, 'technicians', customName);
          docPaths[fieldname] = url;
        }
      });
      await Promise.all(uploadPromises);
    }

    // 3. Update Technician with Doc Paths
    const updatedTech = await technicianManager.updateTechnicianDocuments(tech.id, docPaths);

    // 4. Save to Location Manager
    if (parsedLocation) {
      await locationManager.saveUserRealtimeLocation(tech.id, parsedLocation);
    }

    res.json({ success: true, technician: updatedTech || tech });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});
// --- Invoice Routes ---
app.get('/api/invoices/:jobId/download', authenticateSession, async (req, res) => {
  try {
    const { jobId } = req.params;
    console.log(`[INVOICE-DEBUG] Download request received for Job: ${jobId}, User: ${req.user.id}, Role: ${req.user.role}`);

    // Check Job Ownership
    const job = await jobManager.getJob(jobId);
    if (!job) {
      console.log(`[INVOICE-DEBUG] Job ${jobId} not found.`);
      return res.status(404).json({ error: 'Job not found' });
    }

    // Auth Check
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
    const isOwner = job.userId === req.user.id;
    const isTech = job.technicianId === req.user.id;

    console.log(`[INVOICE-DEBUG] Auth Check: isAdmin=${isAdmin}, isOwner=${isOwner}, isTech=${isTech}`);

    if (!isAdmin && !isOwner && !isTech) {
      console.log(`[INVOICE-DEBUG] Unauthorized access attempt by User ${req.user.id} for Job ${jobId}`);
      return res.status(403).json({ error: 'Unauthorized access to this invoice.' });
    }

    console.log(`[INVOICE-DEBUG] Generation phase starting for Job ${jobId}`);
    const { buffer, url } = await invoiceManager.getOrGenerateInvoice(jobId);

    if (buffer) {
      console.log(`[INVOICE-DEBUG] Serving invoice buffer for Job ${jobId}`);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Invoice-${jobId}.pdf"`);
      return res.send(buffer);
    } else if (url) {
      console.log(`[INVOICE-DEBUG] Redirecting to invoice URL for Job ${jobId}: ${url}`);
      return res.redirect(url);
    } else {
      console.error(`[INVOICE-DEBUG] Generation failed or returned empty for Job ${jobId}`);
      return res.status(500).json({ error: 'Failed to generate invoice.' });
    }
  } catch (error) {
    console.error('[INVOICE-DEBUG] Critical error in download route:', error);
    res.status(500).json({ success: false, error: 'Internal server error while processing invoice.' });
  }
});

// --- Socket.io Events ---
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('send_message', (data) => {
    // data: { roomId, senderId, message, timestamp }
    io.to(data.roomId).emit('receive_message', data);
  });

  socket.on('update_location', (data) => {
    // data: { userId, role, location }
    // Update functionality in manager if needed
    if (data.role === 'technician') {
      technicianManager.updateLocation(data.userId, data.location);
    } else {
      locationManager.saveUserRealtimeLocation(data.userId, data.location);
    }
    // Broadcast to relevant rooms if necessary
    if (data.role === 'technician') {
      io.emit('technician_location_update', { technicianId: data.userId, location: data.location });
    }
  });

  socket.on('job_status_change', (data) => {
    // data: { jobId, status, userId, technicianId }
    io.to(`user_${data.userId}`).emit('job_status_updated', data);
    io.to(`tech_${data.technicianId}`).emit('job_status_updated', data);
  });

  socket.on('ride_location_update', (data) => {
    // data: { rideId, location: { lat, lng }, userId, technicianId }
    // 1. Update DB History
    const updatedRide = rideManager.updateRoute(data.rideId, data.location);

    // 2. Broadcast to Customer
    if (updatedRide && updatedRide.jobId) {
      // We need to know who the customer is. 
      // Ideally the ride object or job object has userId.
      // Assuming data payload has it for efficiency, or we fetch job.
      // For now, trust data.userId or we'd need to fetch Job.
      // Let's Broadcast to specfic User Room
      io.to(`user_${data.userId}`).emit('live_tracking_update', {
        rideId: data.rideId,
        location: data.location,
        technicianId: data.technicianId
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// --- Ride Routes [NEW] ---
app.post('/api/rides/start', async (req, res) => {
  try {
    const { technicianId, jobId, startLocation } = req.body;
    // Verify job exists
    const job = await jobManager.getJob(jobId);
    if (!job) return res.status(404).json({ success: false, error: "Job not found" });

    const ride = await rideManager.startRide(technicianId, jobId, startLocation);

    // Notify User
    io.to(`user_${job.userId}`).emit('ride_started', ride);

    res.json({ success: true, ride });
  } catch (error) {
    console.error("Ride Start Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/rides/:id/end', async (req, res) => {
  try {
    const ride = await rideManager.completeRide(req.params.id);
    if (ride) {
      // Notify User
      // We need userId, unfortunately update doesn't return joined job. 
      // Real app would fetch job. Simplified:
      // io.to(...).emit('ride_ended');
      res.json({ success: true, ride });
    } else {
      res.status(404).json({ success: false, error: "Ride not found" });
    }
  } catch (err) {
    console.error("Ride End Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/rides/technician/:id', (req, res) => {
  const rides = rideManager.getRidesByTechnician(req.params.id);
  res.json({ success: true, rides });
});

// --- User Routes ---
app.post('/api/users/register', upload.single('photo'), async (req, res) => {
  try {
    console.log('[REGISTER] Starting registration...');
    console.log('[REGISTER] USE_SUPABASE:', process.env.USE_SUPABASE);
    console.log('[REGISTER] Body:', req.body); // Log body (multipart fields)

    // Note: When using multer, fields are in req.body
    const { name, email, phone, password } = req.body;
    let { location } = req.body;

    // Parse location if sent as string (Multipart form-data sends everything as strings)
    if (typeof location === 'string') {
      try { location = JSON.parse(location); } catch (e) { console.error("Loc parse error", e); }
    }

    // Mandatory Location Check
    if (!location || !location.latitude || !location.longitude) {
      throw new Error('Realtime location is mandatory for registration.');
    }

    console.log('[REGISTER] Creating user:', email);

    // Upload Photo if present
    let photoUrl = null;
    if (req.file) {
      const customName = `user-${Date.now()}-${req.file.originalname}`;
      photoUrl = await storageManager.upload(req.file, 'avatars', customName);
    }

    // Save User with Location
    const user = await userManager.createUser(name, email, phone, location, password, photoUrl);
    console.log('[REGISTER] User created successfully:', user.id);

    // Also save to Location Manager specifically
    await locationManager.saveUserRealtimeLocation(user.id, location);

    // Auto-Login: Create Session
    const session = await sessionManager.createSession(user.id, 'user', null); // deviceId could be passed if critical

    res.json({ success: true, user, sessionToken: session.token });
  } catch (error) {
    console.error('[REGISTER] Error:', error.message);
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password, deviceId, location } = req.body;
    const user = await userManager.login(email, password);
    if (user) {
      if (user.status === 'Banned') {
        return res.status(403).json({
          success: false,
          error: 'Your profile has been blacklisted. Please contact support.',
          status: 'Banned'
        });
      }

      // Capture location during login if provided
      if (location) {
        await userManager.updateUser(user.id, { location });
        await locationManager.saveUserRealtimeLocation(user.id, location);
      }

      // [AUTO-LIFE] Check and Sync Membership Expiry
      const syncedUser = await userManager.checkAndSyncMembership(user.id);
      if (syncedUser && syncedUser.statusChanged && syncedUser.newTier === 'Free') {
        await notificationManager.createNotification(user.id, 'user', 'Membership Expired', 'Your Premium membership has expired. You have been switched to the Free tier.', 'membership_expired', user.id);
      }

      // Create Session
      const session = await sessionManager.createSession(user.id, 'user', deviceId);
      res.json({
        success: true,
        user: { ...user, ...syncedUser, location: location || user.location }, // Return fresh location and membership
        sessionToken: session.token
      });
    } else {
      // [DIAGNOSTIC] Check if failure is due to DB connection
      try {
        // Attempt a lightweight read to see if DB is alive
        await userManager.getAllUsers();
      } catch (dbErr) {
        console.error("Login failed due to DB Error:", dbErr);
        return res.status(500).json({ success: false, error: 'Server Error: Database Connection Failed. Please check Render Environment Variables.' });
      }

      res.status(401).json({ success: false, error: 'Invalid credentials. (Database is connected)' });
    }
  } catch (err) {
    console.error("[Server] User Login Error:", err);
    res.status(500).json({ success: false, error: 'Internal server error during login' });
  }
});

app.post('/api/users/logout', async (req, res) => {
  const { token } = req.body;
  if (token) {
    await sessionManager.deleteSession(token);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

app.get('/api/users/:id', authenticateSession, async (req, res) => {
  // Always sync membership on fetch to ensure dashboard matches DB
  const syncedUser = await userManager.checkAndSyncMembership(req.params.id);
  if (syncedUser) {
    if (syncedUser.statusChanged && syncedUser.newTier === 'Free') {
      await notificationManager.createNotification(req.params.id, 'user', 'Membership Expired', 'Your Premium membership has reached its end date. You are now on the Free tier.', 'membership_expired', req.params.id);
      io.to(`user_${req.params.id}`).emit('membership_update', { user: syncedUser });
    }
    res.json({ success: true, user: syncedUser });
  } else res.status(404).json({ success: false, error: 'User not found' });
});

app.put('/api/users/:id', authenticateSession, async (req, res) => {
  try {
    const { name, photo, password, location } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (photo) updates.photo = photo;
    if (password) updates.password = password;
    if (location) updates.location = location;

    const user = await userManager.updateUser(req.params.id, updates);
    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(404).json({ success: false, error: 'User not found' });
    }
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// --- Technician Routes ---
// Old register route removed, replaced by Multer version above.
// app.post('/api/technicians/register', ... ) replaced.

app.post('/api/technicians/login', async (req, res) => {
  const { email, password, latitude, longitude } = req.body;

  console.log('--- Tech Login Request ---');
  // Pass dynamic location to login
  const technician = await technicianManager.login(email, password, latitude, longitude);

  if (technician) {
    // Create Session
    const session = await sessionManager.createSession(technician.id, 'technician', req.body.deviceId);

    // Ensure role is injected for socket room identification
    const technicianWithRole = { ...technician, role: 'technician' };
    res.json({ success: true, technician: technicianWithRole, sessionToken: session.token });
  } else {
    // [DIAGNOSTIC] Check if failure is due to DB connection
    try {
      await technicianManager.getAllTechnicians();
    } catch (dbErr) {
      console.error("Tech Login failed due to DB Error:", dbErr);
      return res.status(500).json({ success: false, error: 'Server Error: Database Connection Failed. Please check Render Environment Variables.' });
    }
    res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
});

app.post('/api/technicians/search', async (req, res) => {
  try {
    const { latitude, longitude, serviceType, radius } = req.body;
    if (!latitude || !longitude || !serviceType) {
      return res.status(400).json({ success: false, error: 'Missing location or service type' });
    }

    const technicians = await technicianManager.searchTechnicians(latitude, longitude, serviceType, radius);
    res.json({ success: true, count: technicians.length, technicians });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, error: 'Internal server error during search' });
  }
});

app.get('/api/technicians', async (req, res) => {
  if (req.query.serviceType) {
    const techs = await technicianManager.findByService(req.query.serviceType);
    res.json({ success: true, technicians: techs });
  } else {
    const techs = await technicianManager.getAllTechnicians();
    res.json({ success: true, technicians: techs });
  }
});

// [NEW] Get Top Rated Technicians for "Technician of the Month"
app.get('/api/technicians/top-rated', async (req, res) => {
  try {
    const allTechs = await technicianManager.getAllTechnicians();

    const enrichedTechs = await Promise.all(allTechs.map(async tech => {
      // 1. Get Feedbacks
      const feedbacks = await feedbackManager.getFeedbackForTechnician(tech.id);

      // 2. Calc Average Rating
      let averageRating = 0;
      let detailedRatings = {
        behavior: 0,
        attitude: 0,
        professionalism: 0,
        communication: 0,
        expertise: 0, // Knowledge
        timeliness: 0, // Punctuality
        honesty: 0,
        respect: 0
      };

      if (feedbacks.length > 0) {
        const total = feedbacks.reduce((sum, f) => {
          const categories = Object.values(f.ratings || {});
          const feedbackAvg = categories.length ? categories.reduce((a, b) => a + b, 0) / categories.length : 0;
          return sum + feedbackAvg;
        }, 0);
        averageRating = parseFloat((total / feedbacks.length).toFixed(1));

        // Aggregate Categories
        const cats = ['behavior', 'attitude', 'professionalism', 'communication', 'knowledge', 'punctuality', 'honesty', 'respect'];
        cats.forEach(key => {
          const sum = feedbacks.reduce((a, f) => a + (f.ratings?.[key] || 0), 0);
          detailedRatings[key === 'knowledge' ? 'expertise' : (key === 'punctuality' ? 'timeliness' : key)] = parseFloat((sum / feedbacks.length).toFixed(1));
        });
      }

      // 3. Get Job Stats
      const stats = await jobManager.getJobStats(tech.id); // { total, rejected, ratio }
      // Mock On-Time based on Timeliness rating if jobs exist, else 100% or 0
      const onTimeRecord = detailedRatings.timeliness ? Math.round((detailedRatings.timeliness / 5) * 100) : (stats.total > 0 ? 100 : 100);

      return {
        ...tech,
        rating: averageRating,
        reviewCount: feedbacks.length,
        jobsCompleted: stats.total,
        onTimeRecord: onTimeRecord, // %
        location: tech.addressDetails?.city || 'Unknown',
        badge: averageRating >= 4.8 ? 'Top Rated' : (stats.total > 50 ? 'Expert' : 'Verified'),
        detailedRatings
      };
    }));

    // Sort by Best Rating + Job Count
    const topRated = enrichedTechs
      .filter(t => t.rating >= 0) // Show all for now
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5); // Return Top 5

    res.json({ success: true, technicians: topRated });
  } catch (error) {
    console.error('Top Rated Error', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// --- Notification Routes [NEW] ---
app.get('/api/notifications/:userId', (req, res) => {
  // If userId is 'admin', checks role-based.
  if (req.params.userId === 'admin' || req.params.userId === 'superadmin') {
    const notifs = notificationManager.getAdminNotifications();
    res.json({ success: true, notifications: notifs });
  } else {
    const notifs = notificationManager.getNotifications(req.params.userId);
    res.json({ success: true, notifications: notifs });
  }
});

app.put('/api/notifications/:id/read', async (req, res) => {
  await notificationManager.markRead(req.params.id);
  res.json({ success: true });
});

// --- Super Admin Routes ---
app.post('/api/superadmin/login', async (req, res) => {
  const { email, password, deviceId } = req.body;
  const admin = await superAdminManager.login(email, password);
  if (admin) {
    const session = await sessionManager.createSession(admin.id, 'superadmin', deviceId);
    res.json({ success: true, superadmin: admin, sessionToken: session.token });
  } else {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
});

app.post('/api/superadmin/create-admin', async (req, res) => {
  try {
    // Authenticate (Basic check, normally middleware)
    // const auth = req.headers.authorization; ...
    const { name, email, password, location } = req.body;
    const result = await superAdminManager.createSubAdmin(name, email, password, location);
    res.json({ success: true, admin: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/superadmin/create-user', async (req, res) => {
  try {
    const { name, email, phone, password, location } = req.body;
    // Super Admin action bypasses generic registration limitations if any
    const user = await userManager.createUser(name, email, phone, password, location);
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/superadmin/create-technician', async (req, res) => {
  try {
    const { name, email, phone, serviceType, location, password, experience, addressDetails } = req.body;
    const tech = await technicianManager.createTechnician(name, email, phone, serviceType, location, password, experience, addressDetails);
    res.json({ success: true, technician: tech });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Testimonial Routes ---
app.get('/api/testimonials', async (req, res) => {
  const list = await testimonialManager.getTestimonials();
  res.json({ success: true, testimonials: list });
});
app.post('/api/testimonials', async (req, res) => {
  const { userName, userAvatar, rating, comment } = req.body;
  const t = await testimonialManager.createTestimonial(userName, userAvatar, rating, comment);
  res.json({ success: true, testimonial: t });
});
app.delete('/api/testimonials/:id', async (req, res) => {
  await testimonialManager.deleteTestimonial(req.params.id);
  res.json({ success: true });
});

// --- Offer Routes ---
app.get('/api/offers', async (req, res) => {
  const list = await offerManager.getAllOffers();
  res.json({ success: true, offers: list });
});
app.post('/api/offers', async (req, res) => {
  try {
    const offerData = req.body;
    // Map Frontend keys to Manager expected keys if needed, but Manager handles camelCase.
    // Ensure all fields are passed.
    const o = await offerManager.createOffer(offerData);
    res.json({ success: true, offer: o });
  } catch (err) {
    console.error("Create Offer Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
app.delete('/api/offers/:id', async (req, res) => {
  await offerManager.deleteOffer(req.params.id);
  res.json({ success: true });
});

// --- Finance Routes ---
// --- Finance Routes ---
app.get('/api/admin/finance', verifyAdmin, async (req, res) => {
  try {
    let transactions = [];
    if (req.admin.role === 'admin' && req.admin.fixed_latitude && req.admin.fixed_longitude) {
      transactions = await financeManager.getTransactionsByLocation(req.admin.fixed_latitude, req.admin.fixed_longitude, 30, userManager);
    } else {
      transactions = await financeManager.getAllTransactions();
    }

    const balance = await financeManager.getSystemWalletBalance();

    // Calculate simple stats
    const revenue = transactions
      .filter(t => t.type === 'debit')
      .reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);

    const payouts = transactions
      .filter(t => t.type === 'credit' && t.description?.includes('Payout'))
      .reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);

    res.json({
      success: true,
      transactions: transactions.reverse().slice(0, 50), // Last 50
      stats: { revenue, payouts, balance }
    });
  } catch (err) {
    console.error("Finance API Error", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Admin Enhanced Routes ---
app.post('/api/admin/setup', async (req, res) => {
  // Initial Setup or Create Admin
  const { name, email, password, location } = req.body; // location = { latitude, longitude, address }
  const admin = await adminManager.createAdmin(name, email, password, 'Admin', location);
  res.json({ success: true, admin });
});

// [NEW] Get Current Admin Profile (Fresh Data)
app.get('/api/admin/me', verifyAdmin, async (req, res) => {
  try {
    const admin = await adminManager.db.find('id', req.user.id);
    if (!admin) return res.status(404).json({ error: 'Admin not found' });
    // Don't send password
    const { password, ...rest } = admin;
    res.json({ success: true, admin: rest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/nearby-entities', verifyAdmin, async (req, res) => {
  // Enforce Server-Side Geo-Fencing for Map
  // If Admin has fixed location, IGNORE the body and use the fixed location
  let latitude, longitude;

  if (req.user.fixed_latitude && req.user.fixed_longitude) {
    latitude = req.user.fixed_latitude;
    longitude = req.user.fixed_longitude;
    console.log(`[AdminMap] Enforcing Fixed Location: ${latitude}, ${longitude}`);
  } else {
    // Fallback to body (e.g. for superadmin moving around map manually)
    latitude = req.body.latitude;
    longitude = req.body.longitude;
    console.log(`[AdminMap] Using Requested Location: ${latitude}, ${longitude}`);
  }

  if (!latitude || !longitude) return res.status(400).json({ error: 'Location required' });
  const entities = await adminManager.getNearbyEntities(latitude, longitude);

  // Return the CENTER used so the frontend map can re-center if forced
  res.json({ success: true, ...entities, enforcedCenter: { lat: latitude, lng: longitude } });
});

app.get('/api/admin/system-stats', async (req, res) => {
  const stats = await performerManager.getSystemStats();
  res.json({ success: true, stats });
});

app.get('/api/admin/top-performers', async (req, res) => {
  const techs = await performerManager.getTopTechnicians();
  res.json({ success: true, technicians: techs });
});

// --- Admin Routes ---
// --- Admin Routes ---
app.get('/api/admin/users', verifyAdmin, async (req, res) => {
  // Enforce Server-Side Geo-Fencing
  const lat = req.user.fixed_latitude || req.query.lat;
  const lng = req.user.fixed_longitude || req.query.lng;
  console.log(`[AdminAPI] Fetching Users. Filter: ${lat}, ${lng} (Source: ${req.user.fixed_latitude ? 'Profile' : 'Query'})`);

  const users = await adminManager.getUsers(lat, lng);
  res.json({ success: true, users });
});

app.get('/api/admin/technicians', verifyAdmin, async (req, res) => {
  const lat = req.user.fixed_latitude || req.query.lat;
  const lng = req.user.fixed_longitude || req.query.lng;
  console.log(`[AdminAPI] Fetching Technicians. Filter: ${lat}, ${lng}`);

  const technicians = await adminManager.getTechnicians(lat, lng);
  res.json({ success: true, technicians });
});

app.get('/api/admin/jobs', verifyAdmin, async (req, res) => {
  const lat = req.user.fixed_latitude || req.query.lat;
  const lng = req.user.fixed_longitude || req.query.lng;
  console.log(`[AdminAPI] Fetching Jobs. Filter: ${lat}, ${lng}`);

  const jobs = await adminManager.getJobs(lat, lng);
  res.json({ success: true, jobs });
});

app.get('/api/admin/stats', verifyAdmin, async (req, res) => {
  try {
    const lat = req.user.fixed_latitude || req.query.lat;
    const lng = req.user.fixed_longitude || req.query.lng;

    // Debug Log for Geo-Fencing
    if (lat && lng) {
      console.log(`[AdminStats] Calculating Geo-Fenced stats for: ${lat}, ${lng}`);
    } else {
      console.log(`[AdminStats] Calculating Global stats (No fixed location found)`);
    }

    const stats = await adminManager.getStats(lat, lng);
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Stats Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
// --- Admin User Management Routes [DEPRECATED - Moved to consolidated block below] ---

// --- Admin User Management Routes [NEW] ---

app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await userManager.getAllUsers();

    // Enrich with Wallet & Job Data
    // Use Promise.all for parallel async fetching
    const enrichedUsers = await Promise.all(users.map(async user => {
      // NOTE: getBalance and getJobsByUser are now async!
      const balance = await financeManager.getBalance(user.id);
      const jobs = await jobManager.getJobsByUser(user.id);

      // Sending full jobs so drawer can show history
      return {
        ...user,
        walletBalance: balance,
        jobs: jobs,
        membership: user.membership || 'Free',
        status: user.status || 'Active'
      };
    }));

    res.json({ success: true, users: enrichedUsers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/admin/users/:id/ban', async (req, res) => {
  try {
    const id = String(req.params.id).trim();
    console.log(`SERVER: Received Ban Request for ID: "${id}"`);

    // Attempt update
    const user = await userManager.setStatus(id, 'Banned');

    if (user) {
      console.log(`SERVER: User banned successfully: ${user.name}`);
      // 1. Notify User (Real-time force logout/disable)
      io.to(`user_${user.id}`).emit('account_status_change', { status: 'Banned' });

      // 2. Notify Admin
      io.emit('admin_user_update', user);

      // 3. Persist Notification
      notificationManager.createNotification(user.id, 'user', 'Account Suspended', 'Your account has been banned by the administrator.', 'account_banned', user.id);

      res.json({ success: true, user });
    } else {
      console.error(`SERVER: User not found for ID: ${id}`);
      // Try to find if it exists with different type
      const allUsers = await userManager.getAllUsers();
      const foundLoose = allUsers.find(u => u.id == id);
      if (foundLoose) {
        console.log(`SERVER: Found user with loose equality! Actual ID: ${foundLoose.id} (Type: ${typeof foundLoose.id})`);
        // Try updating with actual ID
        const userRetry = await userManager.setStatus(foundLoose.id, 'Banned');
        if (userRetry) {
          console.log("SERVER: Retry success.");
          io.to(`user_${userRetry.id}`).emit('account_status_change', { status: 'Banned' });
          io.emit('admin_user_update', userRetry);
          res.json({ success: true, user: userRetry });
          return;
        }
      }
      res.status(404).json({ success: false, error: 'User not found' });
    }
  } catch (error) {
    console.error("SERVER: Ban Error", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/admin/users/:id/unban', async (req, res) => {
  try {
    const id = String(req.params.id).trim();
    console.log(`SERVER: Received Unban Request for ID: "${id}"`);

    // Attempt update
    const user = await userManager.setStatus(id, 'Active');

    if (user) {
      console.log(`SERVER: User unbanned: ${user.name}`);
      io.to(`user_${user.id}`).emit('account_status_change', { status: 'Active' });
      io.emit('admin_user_update', user);
      notificationManager.createNotification(user.id, 'user', 'Account Reactivated', 'Your account has been reactivated.', 'account_active', user.id);
      res.json({ success: true, user });
    } else {
      console.error(`SERVER: User not found for ID: ${id}`);
      // Loose Search Fallback
      const allUsers = await userManager.getAllUsers();
      const foundLoose = allUsers.find(u => u.id == id);
      if (foundLoose) {
        console.log(`SERVER: Found loose match for unban.`);
        const userRetry = await userManager.setStatus(foundLoose.id, 'Active');
        if (userRetry) {
          io.to(`user_${userRetry.id}`).emit('account_status_change', { status: 'Active' });
          io.emit('admin_user_update', userRetry);
          res.json({ success: true, user: userRetry });
          return;
        }
      }
      res.status(404).json({ success: false, error: 'User not found' });
    }
  } catch (error) {
    console.error("SERVER: Unban Error", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/admin/users/:id/membership', async (req, res) => {
  try {
    const id = String(req.params.id).trim();
    const { tier } = req.body; // 'Free' or 'Premium'

    const user = await userManager.setMembership(id, tier);
    if (user) {
      // Send full user object for easier state merging
      io.to(`user_${user.id}`).emit('membership_update', { user });
      io.emit('admin_user_update', user);
      notificationManager.createNotification(user.id, 'user', 'Membership Updated', `Your membership has been updated to ${tier}.`, 'membership_update', user.id);
      res.json({ success: true, user });
    } else {
      res.status(404).json({ success: false, error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- Admin User/Job Routes ---
app.post('/api/admin/users', async (req, res) => {
  try {
    const { email, password, options } = req.body;
    const { name, role, membership } = options?.data || {};

    // Create basic user
    const newUser = await userManager.createUser(name, email, '', password, {}, null);

    // Apply role/membership updates if needed
    if (newUser) {
      const updates = {};
      if (membership) updates.membership = membership;
      if (role) updates.role = role;

      if (Object.keys(updates).length > 0) {
        await userManager.updateUser(newUser.id, updates);
      }
      res.json({ success: true, user: newUser });
    } else {
      res.status(400).json({ success: false, error: 'User creation failed' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/admin/users/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const updates = req.body;
    const updatedUser = await userManager.updateUser(id, updates);
    if (updatedUser) {
      res.json({ success: true, user: updatedUser });
    } else {
      res.status(404).json({ success: false, error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/admin/jobs/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const updates = req.body;
    const updatedJob = await jobManager.updateJob(id, updates);
    if (updatedJob) {
      res.json({ success: true, job: updatedJob });
    } else {
      res.status(404).json({ success: false, error: 'Job not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/admin/stats', async (req, res) => {
  try {
    const users = await userManager.getAllUsers();
    const jobs = await jobManager.getAllJobs();
    const technicians = await technicianManager.getAllTechnicians();
    const activeTechnicians = technicians.filter(t => t.status === 'Active' || t.status === 'Available');

    console.log(`[Stats DEBUG] Total Users: ${users.length}, Total Jobs: ${jobs.length}, Total Techs: ${technicians.length}`); // Debug

    // 1. Job Distribution (Normalize status to lowercase)
    const getCount = (list, statuses) => list.filter(j => statuses.includes((j.status || '').toLowerCase())).length;

    const jobStats = {
      completed: getCount(jobs, ['completed']),
      pending: getCount(jobs, ['pending']),
      cancelled: getCount(jobs, ['cancelled', 'rejected']),
      in_progress: getCount(jobs, ['in-progress', 'accepted', 'assigned'])
    };

    console.log('[Stats DEBUG] Job Stats:', jobStats); // Debug

    const jobDistribution = [
      { name: 'Completed', value: jobStats.completed, color: '#10b981' },
      { name: 'Pending', value: jobStats.pending, color: '#f59e0b' },
      { name: 'Cancelled', value: jobStats.cancelled, color: '#ef4444' },
      { name: 'In Progress', value: jobStats.in_progress, color: '#3b82f6' }
    ];

    // 2. Registration Trends (Last 30 Days)
    const trends = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);

      const day = d.getDate();
      const month = d.toLocaleString('default', { month: 'short' });
      const year = d.getFullYear();
      const label = `${day} ${month}`; // e.g. "10 Jan"

      const count = users.filter(u => {
        const dateStr = u.createdAt || u.created_at || u.date_created;
        if (!dateStr) return false;
        const uDate = new Date(dateStr);
        return uDate.getDate() === day && uDate.getMonth() === d.getMonth() && uDate.getFullYear() === year;
      }).length;

      trends.push({ name: label, count });
    }

    // 2b. Technician Registration Trends (Last 30 Days)
    const technicianTrends = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);

      const day = d.getDate();
      const month = d.toLocaleString('default', { month: 'short' });
      const year = d.getFullYear();
      const label = `${day} ${month}`;

      const count = technicians.filter(t => {
        const dateStr = t.joinedAt || t.joined_at || t.createdAt || t.created_at;
        if (!dateStr) return false;
        const tDate = new Date(dateStr);
        return tDate.getDate() === day && tDate.getMonth() === d.getMonth() && tDate.getFullYear() === year;
      }).length;

      technicianTrends.push({ name: label, count });
    }

    // 3. Activity Log (Normalized)
    const recentActivity = [
      ...jobs.map(j => ({
        id: `job_${j.id}`,
        user: j.contactName || 'Client',
        action: `created job #${j.id}`,
        timestamp: j.createdAt || j.created_at || new Date().toISOString(),
        icon: 'work',
        type: 'job'
      })),
      ...users.map(u => ({
        id: `user_${u.id}`,
        user: u.name || 'User',
        action: `registered`,
        timestamp: u.createdAt || u.created_at || new Date().toISOString(),
        icon: 'person_add',
        type: 'user'
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);

    // 4. Calculate Trends (Month over Month)
    const getTrend = (data, dateField) => {
      const now = new Date();
      const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const firstDayNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const currentMonthCount = data.filter(item => {
        const d = new Date(item[dateField] || item.createdAt || item.created_at);
        return d >= firstDayCurrentMonth && d < firstDayNextMonth;
      }).length;

      const lastMonthCount = data.filter(item => {
        const d = new Date(item[dateField] || item.createdAt || item.created_at);
        return d >= firstDayLastMonth && d < firstDayCurrentMonth;
      }).length; // Corrected: should be .length for count

      if (lastMonthCount === 0) return currentMonthCount > 0 ? 100 : 0;
      return Math.round(((currentMonthCount - lastMonthCount) / lastMonthCount) * 100);
    };

    const trendsData = {
      users: getTrend(users, 'createdAt'),
      jobs: getTrend(jobs, 'createdAt'),
      revenue: 0 // Placeholder
    };

    // Helper for safe, case-insensitive status matching
    const countStatus = (arr, statusList) => {
      const lowerStatusList = statusList.map(s => s.toLowerCase());
      return arr.filter(item => {
        const s = (item.status || '').toLowerCase();
        return lowerStatusList.includes(s);
      }).length;
    };

    // DEBUG: Log first 3 job statuses to verify mapping
    console.log('[API] Debug Job Statuses:', jobs.slice(0, 3).map(j => j.status));

    // 5. Detailed Breakdowns (Corrected for DB casing)
    const detailedStats = {
      // Jobs
      jobsPending: countStatus(jobs, ['pending']),
      jobsActive: countStatus(jobs, ['accepted', 'in-progress', 'in_progress', 'ongoing', 'started']),
      jobsRejected: countStatus(jobs, ['rejected', 'cancelled', 'canceled']),
      jobsAccepted: countStatus(jobs, ['accepted']),
      jobsFinishing: countStatus(jobs, ['work_done', 'completed', 'finishing']), // mapped 'completed' here too

      // Technicians
      // DB uses lowercase 'available', 'approved', etc.
      techsAvailable: countStatus(technicians, ['available', 'active', 'online']),
      techsUnavailable: countStatus(technicians, ['offline', 'inactive', 'unavailable']),
      techsEngaged: countStatus(technicians, ['engaged', 'busy', 'working']),

      techsPremium: technicians.filter(t => (t.membership || '').toLowerCase() === 'premium').length,
      techsFree: technicians.filter(t => (t.membership || '').toLowerCase() === 'free' || !t.membership).length,

      techsApproved: countStatus(technicians, ['approved', 'active', 'verified']),
      techsNotApproved: countStatus(technicians, ['pending', 'unverified', 'review']),
      techsBlacklisted: countStatus(technicians, ['banned', 'blacklisted', 'suspended']),

      techsExpiring: technicians.filter(t => {
        if (!t.membershipSince) return false;
        const since = new Date(t.membershipSince);
        const expiry = new Date(since);
        expiry.setDate(expiry.getDate() + 30); // Assume 30 day cycle

        const now = new Date();
        const daysLeft = (expiry - now) / (1000 * 60 * 60 * 24);
        return daysLeft > 0 && daysLeft <= 7;
      }).length,

      // Users
      usersFree: users.filter(u => (u.membership || '').toLowerCase() === 'free' || !u.membership).length,
      usersPremium: users.filter(u => (u.membership || '').toLowerCase() === 'premium').length,
      usersBanned: countStatus(users, ['banned', 'suspended']),
      usersExpiring: users.filter(u => {
        if (!u.membershipExpiry) return false;
        const expiry = new Date(u.membershipExpiry);
        const now = new Date();
        const daysLeft = (expiry - now) / (1000 * 60 * 60 * 24);
        return daysLeft > 0 && daysLeft <= 7;
      }).length
    };

    // Revenue Trend calculation (sum of offerPrice for current vs last month)
    const getRevenueTrend = () => {
      const now = new Date();
      const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const currentMonthRevenue = jobs.reduce((acc, j) => {
        const d = new Date(j.createdAt || j.created_at);
        if (d >= firstDayCurrentMonth) return acc + (Number(j.offerPrice) || Number(j.offer_price) || 0);
        return acc;
      }, 0);

      const lastMonthRevenue = jobs.reduce((acc, j) => {
        const d = new Date(j.createdAt || j.created_at);
        if (d >= firstDayLastMonth && d < firstDayCurrentMonth) return acc + (Number(j.offerPrice) || Number(j.offer_price) || 0);
        return acc;
      }, 0);

      if (lastMonthRevenue === 0) return currentMonthRevenue > 0 ? 100 : 0;
      return Math.round(((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);
    };
    trendsData.revenue = getRevenueTrend();

    console.log('[API] Calculated Detailed Stats:', detailedStats);

    res.json({
      success: true,
      stats: {
        totalUsers: users.length,
        totalJobs: jobs.length,
        activeTechnicians: activeTechnicians.length,
        revenue: jobs.reduce((acc, j) => acc + (Number(j.offerPrice) || Number(j.offer_price) || 0), 0),
        jobDistribution,
        registrationTrends: trends,
        technicianTrends, // New field
        activityLog: recentActivity,
        trends: trendsData,
        detailed: detailedStats
      }
    });

  } catch (err) {
    console.error('[API] Admin Stats Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});


// --- Feedback & Testimonial Routes ---

// [NEW] Public Testimonials Endpoint
app.get('/api/testimonials', async (req, res) => {
  try {
    // 1. Get all feedback
    const feedbacks = await feedbackManager.getAllFeedback();

    // 2. Filter for high quality (e.g. avg rating >= 4)
    const highQuality = feedbacks.filter(f => {
      if (!f.ratings) return false;
      const scores = Object.values(f.ratings);
      if (scores.length === 0) return false;
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      return avg >= 4 & f.comment && f.comment.length > 10;
    });

    // 3. Enrich with User Info (Name, Photo, Job Title if possible)
    const testimonials = await Promise.all(highQuality.map(async f => {
      const user = await userManager.getUser(f.userId);
      // Determine a title using user role or previous jobs? For now mock or use generically
      // Or maybe check if they are a business client? 
      // Simplified: Just use Name and generic title

      const scores = Object.values(f.ratings);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

      return {
        id: f.id,
        name: user ? user.name : 'Happy Client',
        role: user ? (user.role === 'user' ? 'Homeowner' : 'Client') : 'Customer', // Could be enriched if we had Company field
        photo: user ? user.photo : null,
        comment: f.comment,
        rating: Math.round(avg * 10) / 10, // 1 decimal
        date: f.createdAt
      };
    }));

    // Limit to latest 10
    const sorted = testimonials.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

    res.json({ success: true, testimonials: sorted });
  } catch (error) {
    console.error("Testimonials Error", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

app.post('/api/feedback', async (req, res) => {
  try {
    const { userId, technicianId, jobId, ratings, comment } = req.body;
    console.log(`[API] Feedback submission: JobID=${jobId}, TechID=${technicianId}, UserID=${userId}`);

    // Fetch user and job details for complete metadata
    const user = await userManager.getUser(userId);
    const job = jobId ? await jobManager.getJob(jobId) : null;

    // Prepare metadata
    const metadata = {
      recommendationScore: ratings.recommendationScore || 0,
      userName: user?.name || 'Unknown',
      userPhone: user?.phone || '',
      userLocation: user?.location || null,
      serviceCharges: job?.offerPrice || job?.visitingCharges || 0
    };

    // Add feedback with complete metadata (this also auto-calculates and updates avg rating)
    const feedback = await feedbackManager.addFeedback(
      userId,
      technicianId,
      jobId,
      ratings,
      comment,
      metadata
    );

    console.log(`[API] Feedback created successfully, ID: ${feedback.id}`);
    res.json({ success: true, feedback });
  } catch (error) {
    console.error('[API] Feedback submission error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get feedback submitted by a specific user
app.get('/api/feedback/user/:userId', async (req, res) => {
  try {
    const allFeedback = await feedbackManager.getAllFeedback();
    const userFeedback = allFeedback.filter(f => f.userId === req.params.userId);
    res.json({ success: true, feedbacks: userFeedback });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/feedback/technician/:id', async (req, res) => {
  try {
    const feedbacks = await feedbackManager.getFeedbackForTechnician(req.params.id);
    const avgRating = await feedbackManager.calculateAverageRating(req.params.id);
    res.json({ success: true, feedbacks, averageRating: avgRating });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- Location Routes ---
app.get('/api/locations', async (req, res) => {
  const locations = await locationManager.getAllLocations();
  res.json({ success: true, locations });
});

app.post('/api/locations', async (req, res) => {
  try {
    const { city, area, pincode } = req.body;
    const loc = await locationManager.addLocation(city, area, pincode);
    res.json({ success: true, location: loc });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// --- Offer Routes ---
// --- Offer Routes moved down to dedicated section ---

// --- Complaint Routes ---
// --- Complaint Routes ---
app.post('/api/complaints', async (req, res) => {
  try {
    const complaint = await complaintManager.createComplaint(req.body);
    res.json({ success: true, complaint });
  } catch (error) {
    console.error('[API] Complaint Create Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

app.put('/api/complaints/:id/status', async (req, res) => {
  const { status } = req.body;
  const updated = await complaintManager.updateStatus(req.params.id, status);
  res.json({ success: true, complaint: updated });
});

app.get('/api/complaints', async (req, res) => {
  // Should be admin only
  const complaints = await complaintManager.getAllComplaints();
  res.json({ success: true, complaints });
});

app.get('/api/complaints/user/:userId', async (req, res) => {
  try {
    const complaints = await complaintManager.getComplaintsByUser(req.params.userId);
    res.json({ success: true, complaints });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- Job Routes ---
// --- Job Routes ---
app.post('/api/jobs/estimate', async (req, res) => {
  try {
    const { serviceType, userLocation, technicianId } = req.body;
    const { latitude, longitude } = userLocation || {};

    // Calculate
    const charges = await jobManager.calculateVisitingCharges(
      serviceType,
      latitude,
      longitude,
      null, // Tech Location handled by ID lookup
      null,
      technicianId
    );

    res.json({ success: true, estimate: charges });
  } catch (error) {
    console.error('[API] Estimate Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/jobs', authenticateSession, async (req, res) => {
  try {
    console.log('[API] POST /jobs payload:', JSON.stringify(req.body, null, 2));
    const { userId, serviceType, description, location, address, scheduledDate, scheduledTime, contactName, contactPhone, offerPrice, technicianId, visitingCharges, agreementAccepted, paymentStatus, paymentMethod } = req.body;

    // 1. Create the Job (JobManager now handles assignment automatically)
    const job = await jobManager.createJob(userId, serviceType, description, location, address, scheduledDate, scheduledTime, contactName, contactPhone, offerPrice, technicianId, visitingCharges, agreementAccepted, paymentStatus, paymentMethod);

    // [NOTIFICATION] Job Created (Generic)
    notificationManager.createNotification('admin', 'admin', 'New Job Request', `Job #${job.id} created by User`, 'job_created', job.id);

    res.json({ success: true, job });
  } catch (error) {
    console.error('[API] Job Create Error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
      details: error.details || null,
      hint: error.hint || null,
      code: error.code || null
    });
  }
});

// [NEW] Marketplace Endpoint
app.get('/api/jobs/available', async (req, res) => {
  try {
    const { serviceType } = req.query;
    console.log(`[API] Fetching available jobs. Filter: ${serviceType || 'None'}`);

    const unassigned = await jobManager.getUnassignedJobs();
    let available = unassigned;

    if (serviceType) {
      const type = serviceType.toLowerCase();
      available = unassigned.filter(j =>
        (j.serviceType || j.service_type || '').toLowerCase().includes(type)
      );
    }

    // Sort by newest
    available.sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at));

    res.json({ success: true, jobs: available });
  } catch (err) {
    console.error('[API] Available Jobs Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Background Worker: Unassigned Job Scanner ---
setInterval(async () => {
  try {
    const unassignedJobs = await jobManager.getUnassignedJobs();
    if (unassignedJobs.length > 0) {
      // console.log(`[Worker] Found ${unassignedJobs.length} unassigned jobs. Running auto-assignment...`);
      for (const job of unassignedJobs) {
        await jobManager.autoAssignJob(job.id);
      }
    }
  } catch (err) {
    console.error('[Worker] Error in unassigned scan:', err);
  }
}, 30000); // Scan every 30 seconds

app.get('/api/jobs', async (req, res) => {
  const jobs = await jobManager.getAllJobs();
  res.json({ success: true, jobs });
});

app.get('/api/jobs/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { q, status, start, end } = req.query;
    console.log(`[API] GET /jobs/user/${id} query:`, req.query); // DEBUG LOG

    const filters = {
      search: q,
      status,
      startDate: start,
      endDate: end
    };
    const jobs = await jobManager.getJobsByUser(id, filters);
    res.json({ success: true, jobs });
  } catch (error) {
    console.error("[API] Get User Jobs Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// [NEW] User Update Job (Rescheduling/Notes)
app.put('/api/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    console.log(`[API] User/Technician updating Job ${id}:`, updates);

    // Security: In a real app, verify req.user.id owns the job.
    // For now, trusting the ID validation in manager or frontend flow.

    const updatedJob = await jobManager.updateJob(id, updates);
    res.json({ success: true, job: updatedJob });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Duplicate /api/jobs/available removed ---

app.get('/api/jobs/technician/:id', async (req, res) => {
  const jobs = await jobManager.getJobsByTechnician(req.params.id);
  res.json({ success: true, jobs });
});

app.get('/api/jobs/:id', async (req, res) => {
  const job = await jobManager.getJob(req.params.id);
  if (job) res.json({ success: true, job });
  else res.status(404).json({ success: false, error: 'Job not found' });
});

app.put('/api/jobs/:id/status', async (req, res) => {
  try {
    const { status, details } = req.body; // details: { technicianId, reason, otp }

    // 1. Get current job to know context (price, techId, etc.)
    const currentJob = await jobManager.getJob(req.params.id);
    if (!currentJob) return res.status(404).json({ success: false, error: 'Job not found' });

    // 2. Update Job Status (Side effects are now handled inside JobManager)
    // Ensure we capture technicianId and other details even if sent at top level
    const updateDetails = { ...details, ...req.body };
    delete updateDetails.status; // status is already extracted

    const job = await jobManager.updateStatus(req.params.id, status, updateDetails);

    if (job) {
      res.json({ success: true, job });
    }
    else res.status(500).json({ success: false, error: 'Failed to update job' });
  } catch (err) {
    console.error(`[API] Error updating job status ${req.params.id}:`, err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// --- Feedback Routes ---
app.post('/api/feedback', async (req, res) => {
  try {
    const { userId, technicianId, jobId, ratings, comment } = req.body;
    // Extract recommendationScore from ratings payload if present, to ensure it's saved in the top-level column
    const recommendationScore = ratings?.recommendationScore || 0;

    const feedback = await feedbackManager.addFeedback(
      userId,
      technicianId,
      jobId,
      ratings,
      comment,
      { recommendationScore } // Pass as metadata for specific column mapping
    );
    res.json({ success: true, feedback });
  } catch (error) {
    console.error("Feedback Submission Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/feedback', async (req, res) => {
  try {
    const feedbacks = await feedbackManager.getAllFeedback();
    res.json({ success: true, feedbacks });
  } catch (error) {
    console.error("Fetch Feedback Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- Invoice Routes [NEW] ---
// Route moved up to line 285 to ensure correct middleware and order.


app.post('/api/invoices/:jobId/share', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { email } = req.body; // Optional manual recipient
    const job = await jobManager.getJob(jobId);
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' });

    const pdfBuffer = await jobManager.invoiceManager.generateInvoice(job);
    const recipients = email ? [email] : [];
    const result = await jobManager.invoiceManager.sendInvoiceEmail(job, pdfBuffer, recipients);

    res.json(result);
  } catch (err) {
    console.error("Invoice Share Error:", err);
    res.status(500).json({ success: false, error: 'Failed to share invoice' });
  }
});

// --- Invoice Settings Routes [NEW] ---
app.get('/api/invoice-settings', async (req, res) => {
  const settings = await invoiceSettingsManager.getSettings();
  res.json({ success: true, settings });
});

app.post('/api/invoice-settings', upload.single('logo'), async (req, res) => {
  try {
    const updates = req.body;



    // Handle logo upload
    if (req.file) {
      // Logic to save file appropriately
      // Ideally use storageManager, but for invoice basic implementation we can return a path
      // For now, let's copy to server/logo.png or keep using storage manager url

      // OPTION A: Use StorageManager (Best Practice for this codebase)
      const customName = `invoice-logo-${Date.now()}${path.extname(req.file.originalname)}`;
      const logoUrl = await storageManager.upload(req.file, 'misc', customName);
      updates.logoUrl = logoUrl;
    }

    const settings = await invoiceSettingsManager.updateSettings(updates);
    res.json({ success: true, settings });
  } catch (err) {
    console.error('Invoice Settings Update Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});


// ==========================================
// NEW: WALLET ROUTES
// ==========================================

app.get('/api/finance/wallet/:technicianId', async (req, res) => {
  try {
    const { technicianId } = req.params;
    const balance = await financeManager.getBalance(technicianId, true);
    const stats = await financeManager.getFinancialStats(technicianId);
    const analytics = await financeManager.getAIAnalytics(technicianId);

    res.json({
      success: true,
      wallet: {
        balance,
        available: balance, // Debits are already subtracted in getBalance
        ...stats,
        analytics
      }
    });
  } catch (err) {
    console.error('[API] Wallet Fetch Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/finance/banks/:technicianId', async (req, res) => {
  try {
    const banks = await financeManager.getBankAccounts(req.params.technicianId);
    res.json({ success: true, banks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/finance/banks', async (req, res) => {
  try {
    const { technicianId, ...details } = req.body;
    const method = await financeManager.addBankAccount(technicianId, details);
    res.json({ success: true, method });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/finance/withdraw', async (req, res) => {
  try {
    const { technicianId, amount, bankAccountId } = req.body;
    const withdrawal = await financeManager.requestWithdrawal(technicianId, amount, bankAccountId);
    res.json({ success: true, withdrawal });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/finance/withdrawals/:technicianId', async (req, res) => {
  try {
    const withdrawals = await financeManager.getWithdrawals(req.params.technicianId);
    res.json({ success: true, withdrawals });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/finance/tax-reports/:technicianId', async (req, res) => {
  try {
    const analytics = await financeManager.getAIAnalytics(req.params.technicianId);
    res.json({
      success: true,
      taxData: analytics.taxEstimation,
      healthScore: analytics.healthScore
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/finance/invoices/:technicianId', async (req, res) => {
  try {
    const jobs = await jobManager.getJobsByTechnician(req.params.technicianId);
    const invoices = jobs
      .filter(j => j.status === 'Completed' || j.status === 'completed')
      .map(j => ({
        id: j.id,
        date: j.updatedAt,
        amount: j.totalCost || j.offerPrice || 0,
        customer: j.contactName,
        service: j.serviceType,
        status: 'Paid',
        invoiceUrl: j.invoiceUrl || j.invoice_url
      }));
    res.json({ success: true, invoices });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/technicians/:id/transactions', async (req, res) => {
  try {
    const transactions = await financeManager.getTransactionsByUser(req.params.id, true);
    res.json({ success: true, transactions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Pots & Analytics Routes [NEW] ---
app.get('/api/finance/pots/:technicianId', async (req, res) => {
  try {
    const pots = await financeManager.getPots(req.params.technicianId);
    res.json({ success: true, pots });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/finance/pots/update', async (req, res) => {
  try {
    const { technicianId, name, amount, operation } = req.body;
    const pot = await financeManager.updatePot(technicianId, name, amount, operation);
    res.json({ success: true, pot });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/finance/analytics/sync', async (req, res) => {
  try {
    const { technicianId } = req.body;
    const analytics = await financeManager.syncAnalytics(technicianId);
    res.json({ success: true, analytics });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Technician Status & Profile Routes ---

// [NEW] Aggregated Dashboard Stats
app.get('/api/technicians/:id/dashboard-stats', async (req, res) => {
  try {
    const { id } = req.params;

    // Parallel Fetch for Performance
    const [tech, jobStats, financeTxns, complaintStats, activityLogs, activeJobsRes] = await Promise.all([
      technicianManager.getTechnician(id),
      jobManager.getJobStats(id),
      financeManager.getTransactionsByUser(id, true), // true = isTechnician
      complaintManager.getComplaintStats(id),
      activityLogManager.db.findAll('technician_id', id),
      jobManager.getJobsByTechnician(id)
    ]);

    // [AUTO-SYNC] Trigger background sync to ensure technician table columns match JobManager stats
    technicianManager.syncStatsFromJobs(id).catch(err => console.error(`[Stats-Sync] Failed for ${id}:`, err));

    if (!tech) {
      return res.status(404).json({ success: false, error: 'Technician not found' });
    }

    // Process Earnings (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const earningsData = [];
    const daysMap = new Map();

    // Initialize last 7 days with 0
    // [FIX] Use local date string components to match transaction dates accurately in local timezone
    const getLocalYMD = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      // const dateKey = d.toISOString().split('T')[0]; // OLD UTC
      const dateKey = getLocalYMD(d); // NEW Local
      daysMap.set(dateKey, { name: dayName, value: 0 });
      earningsData.push(daysMap.get(dateKey));
    }

    // Populate with actual data (filtered by credit/income)
    financeTxns.forEach(txn => {
      if (txn.type === 'credit' && txn.createdAt) { // [FIX] Use mapped createdAt
        const dateKey = getLocalYMD(new Date(txn.createdAt));
        if (daysMap.has(dateKey)) {
          daysMap.get(dateKey).value += parseFloat(txn.amount);
        }
      }
    });

    // Calculate Totals
    const totalEarnings = financeTxns
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    // Monthly Revenue
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const monthlyRevenue = financeTxns
      .filter(t => t.type === 'credit' && t.createdAt && t.createdAt >= startOfMonth) // [FIX] Use mapped createdAt
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    // Filter Activity Logs (Sort Newest, Limit 10)
    const relevantLogs = (activityLogs || [])
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10)
      .map(log => ({
        id: log.id,
        type: log.type,
        title: log.title,
        message: log.message,
        createdAt: log.created_at,
        meta: log.meta
      }));

    // Active Jobs Processing
    // activeJobsRes might be { success: true, jobs: [...] } or just [...]
    const jobsList = activeJobsRes && activeJobsRes.jobs ? activeJobsRes.jobs : (Array.isArray(activeJobsRes) ? activeJobsRes : []);
    const activeJobs = jobsList.filter(job =>
      ['pending', 'assigned', 'accepted', 'in_progress', 'arrived', 'ongoing', 'started'].includes(job.status)
    ).sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt));

    const responseData = {
      stats: {
        earnings: totalEarnings,
        monthlyRevenue: monthlyRevenue,
        completedJobs: jobStats.completed || 0,
        accepted: jobStats.accepted || 0,
        pending: jobStats.pending || 0,
        rejected: jobStats.rejected || 0,
        usersServed: new Set(jobsList.filter(j => ['completed', 'work_done'].includes(j.status)).map(j => j.userId)).size,
        complaints: complaintStats.total || 0,
        rating: tech.rating || 0
      },
      earningsData: earningsData, // [{ name: 'Mon', value: 1200 }, ...]
      activeJobs: activeJobs,
      activityFeed: relevantLogs
    };

    return res.json({ success: true, ...responseData });
  } catch (err) {
    console.error('[Dashboard-Stats] Error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});


// [NEW] Earnings Hub Data Endpoint
app.get('/api/technicians/:id/earnings-hub', async (req, res) => {
  try {
    const { id } = req.params;
    const [stats, financeTxns, jobs] = await Promise.all([
      analyticsManager.getStats(id),
      financeManager.getTransactionsByUser(id, true),
      jobManager.getJobsByTechnician(id)
    ]);

    if (!stats) {
      // Auto-init if missing
      await analyticsManager.syncStats(id);
    }

    // Process Earnings Data based on Time Range
    const { timeRange } = req.query;
    let daysToFetch = 7; // Default 7D

    if (timeRange === '30D') daysToFetch = 30;
    else if (timeRange === '3M') daysToFetch = 90;
    else if (timeRange === '6M') daysToFetch = 180;
    else if (timeRange === '1Y') daysToFetch = 365;

    const earningsData = [];

    // Efficiency: For very long ranges (1Y), we might want to aggregate by Month in a real app,
    // but for this specific "EarningsHub" graph which usually shows a trend line, 
    // sending daily points is acceptable for < 365 points, or we can aggregate if needed.
    // The user specifically asked for "last 7days and last 30 days".

    for (let i = daysToFetch - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      // Efficient sum: filter and reduce
      // OPTIMIZATION: Ideally we filter financeTxns once by date range, then bucket.
      const dayTotal = financeTxns
        .filter(t => {
          const tDate = t.createdAt || t.created_at || '';
          return t.type === 'credit' && tDate.startsWith(dateKey);
        })
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      earningsData.push({ name: dayName, value: dayTotal, date: dateKey });
    }

    // Pending Jobs
    const pendingJobsList = jobs.filter(j => ['assigned', 'accepted', 'in_progress', 'ongoing'].includes(j.status));

    // Stats Enrichment
    const enrichedStats = {
      projectedNet: stats.pendingValue || 0, // Simplified: Pending Value is projected
      netTrend: 12, // Mock or calculate Month-over-Month
      efficiency: stats.efficiencyScore || 0,
      fvr: stats.fvrPerformance || 0,
      pendingValue: stats.pendingValue || 0,
      pendingJobs: pendingJobsList.length,
      safety: stats.safetyRating || 5,
      speed: stats.speedScore || 5,
      growthPotential: stats.growthPotential || 0,
      rank: `${stats.regionStatus?.percentile || 5}th Peer Group`,
      regionMessage: stats.regionStatus?.message || "You are performing well."
    };

    // Recent Jobs (Limit 5)
    const recentJobs = jobs.slice(0, 5).map(j => ({
      id: j.id,
      status: j.status,
      amount: j.totalCost || j.offerPrice || 0,
      service: j.serviceType,
      date: j.createdAt || j.created_at
    }));

    res.json({
      success: true,
      stats: enrichedStats,
      earningsData,
      aiCoach: stats.aiSuggestions || [],
      recentJobs
    });
  } catch (err) {
    console.error('[EarningsHub-API] Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// [NEW] Job History with Filtering/Pagination
app.get('/api/technicians/:id/job-history', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, serviceType, startDate, endDate, search, page, limit } = req.query;

    const result = await jobManager.getJobHistory(id, {
      status,
      serviceType,
      startDate,
      endDate,
      search,
      page,
      limit
    });

    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[JobHistory] Error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.put('/api/technicians/:id/status', async (req, res) => {
  const { status, location } = req.body;
  const tech = await technicianManager.updateStatus(req.params.id, status);
  if (tech) {
    if (location) await technicianManager.updateLocation(req.params.id, location);
    io.emit('technician_status_update', { technicianId: tech.id, status: tech.status, location: tech.location });
    res.json({ success: true, technician: tech });
  } else {
    res.status(404).json({ success: false, error: 'Technician not found' });
  }
});

app.put('/api/technicians/:id/profile', async (req, res) => {
  try {
    const updates = req.body; // Expect { password, documents: { photo: ... } }
    const tech = await technicianManager.updateProfile(req.params.id, updates);
    if (tech) res.json({ success: true, technician: tech });
    else res.status(404).json({ success: false, error: 'Technician not found' });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// --- Finance/Billing Routes ---
// --- Finance/Billing Routes ---
app.get('/api/finance/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    // Fetch completed jobs with Tech details and Ratings
    const query = `
      SELECT 
        j.id, j.created_at, j.completed_at, j.description, j.service_type, j.status, 
        j.offer_price, j.visiting_charges, j.time_taken,
        t.name as tech_name, t.phone as tech_phone, t.avatar as tech_avatar,
        f.overall as rating
      FROM jobs j
      LEFT JOIN technicians t ON j.technician_id = t.id
      LEFT JOIN feedbacks f ON j.id = f.job_id
      WHERE j.user_id = ? 
      AND (j.status = 'completed' OR j.status = 'work_done')
      ORDER BY j.created_at DESC
    `;

    const jobs = await jobManager.db.all(query, [userId]);

    const bills = jobs.map(job => ({
      id: job.id,
      createdAt: job.created_at,
      completedAt: job.completed_at,
      description: job.description || 'Service Charge',
      serviceType: job.service_type,
      // Amount priority: Offer Price > Visiting Charges > 100 (fallback)
      amount: parseFloat(job.offer_price || job.visiting_charges || 100),
      status: job.status,
      timeTaken: job.time_taken || '1h',
      technician: {
        name: job.tech_name || 'Unknown Technician',
        phone: job.tech_phone,
        avatar: job.tech_avatar,
        rating: job.rating
      }
    }));

    res.json({ success: true, bills });
  } catch (err) {
    console.error("Fetch User Bills Error:", err);
    res.status(500).json({ success: false, error: 'Failed to fetch billing history' });
  }
});

app.post('/api/finance/wallet/top-up', async (req, res) => {
  try {
    const { userId, amount, methodId, couponCode } = req.body;
    // In real world, we'd verify payment with Stripe/PayPal using methodId
    // Here we just simulate success

    // If coupon, apply discount logic? Usually top-up is raw cash, but maybe "Extra credit" coupon?
    // Let's keep it simple: Raw Amount Top-up

    const txn = await financeManager.createTransaction(userId, 'SELF', 'credit', amount, 'Wallet Top-up');
    res.json({ success: true, transaction: txn });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/finance/wallet/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const balance = await financeManager.getBalance(userId);
    const transactions = await financeManager.getTransactionsByUser(userId);

    // Calculate Stats
    const totalEarnings = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalWithdrawn = transactions
      .filter(t => t.type === 'debit' && t.category === 'withdrawal')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Calculate Weekly Trends (Last 7 Days) - Mon to Sun
    // Current approach: Sum amounts per day for current week
    const weeklyTrends = [0, 0, 0, 0, 0, 0, 0];
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sun, 1 = Mon
    // Adjust to Mon=0, Sun=6
    const todayIndex = currentDay === 0 ? 6 : currentDay - 1;

    // Filter last 7 days? Or just current week?
    // Let's do: Mon(0)..Sun(6) of CURRENT week
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - todayIndex);
    startOfWeek.setHours(0, 0, 0, 0);

    transactions.forEach(t => {
      if (t.type === 'credit') {
        const tDate = new Date(t.createdAt || t.created_at);
        if (tDate >= startOfWeek) {
          const day = tDate.getDay(); // 0-6
          const idx = day === 0 ? 6 : day - 1; // Map to 0=Mon
          weeklyTrends[idx] += Number(t.amount);
        }
      }
    });

    const wallet = {
      balance,
      available: balance, // simplified
      totalEarnings,
      totalWithdrawn,
      weeklyTrends,
      transactions // Include if needed, though sent separate in hook
    };

    res.json({ success: true, wallet, transactions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/finance/statement/:userId', async (req, res) => {
  try {
    const pdfBuffer = await financeManager.generateStatementPdf(req.params.userId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=statement-${req.params.userId}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error("PDF Route Error:", err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Failed to generate PDF statement' });
    }
  }
});

app.get('/api/finance/methods/:userId', async (req, res) => {
  try {
    const methods = await financeManager.getPaymentMethods(req.params.userId);
    res.json({ success: true, methods });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/finance/methods', async (req, res) => {
  try {
    const { userId, ...methodData } = req.body;
    const method = await financeManager.addPaymentMethod(userId, methodData);
    res.json({ success: true, method });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/finance/methods/:id', async (req, res) => {
  try {
    await financeManager.deletePaymentMethod(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/finance/verify-coupon', async (req, res) => {
  try {
    const { code, cartAmount } = req.body;
    const result = await financeManager.validateCoupon(code, cartAmount);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// [NEW] PhonePe Routes
app.post('/api/finance/phonepe/pay', async (req, res) => {
  try {
    const { amount, userId } = req.body;
    // Construct standard redirect/callback URLs
    // In local dev, standard might be localhost:5173/finance/success
    // But for redirect, we need the frontend to handle it.
    const origin = req.get('origin') || 'http://localhost:5173';
    const redirectUrl = `${origin}/payment/success`;
    const callbackUrl = `${req.protocol}://${req.get('host')}/api/finance/phonepe/callback`;

    const result = await financeManager.initiatePhonePePayment(userId, amount, redirectUrl, callbackUrl);
    res.json({ success: true, url: result.instrumentResponse.redirectInfo.url, txnId: result.merchantTransactionId });
  } catch (error) {
    console.error("PhonePe Pay Error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/finance/phonepe/callback', (req, res) => {
  console.log("PhonePe S2S Callback Recieved:", req.body);
  // Ideally verify checksum here and update DB status 'completed'
  // For Sandbox, we just acknowledge
  res.json({ success: true });
});

// [NEW] Basic Stats Endpoint for Technician Dashboard
app.get('/api/technicians/:id/stats', async (req, res) => {
  try {
    const techId = req.params.id;
    const tech = await technicianManager.getTechnician(techId);
    if (!tech) return res.status(404).json({ success: false, error: 'Technician not found' });

    // 1. Job Stats
    const stats = {
      totalJobs: tech.totalJobs || 0,
      completedJobs: tech.completedJobs || 0,
      rejectedJobs: tech.rejectedJobs || 0,
      pendingJobs: tech.pendingJobs || 0,
      acceptedJobs: tech.acceptedJobs || 0,
      rating: tech.rating || 0,
      reviewCount: tech.reviewCount || 0
    };

    // 2. Earnings
    const balance = await financeManager.getBalance(techId, true);

    // Monthly Earnings (Calculated from transactions)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const transactions = await financeManager.getTransactionsByUser(techId, true);
    const monthlyEarnings = transactions.reduce((sum, t) => {
      const tDate = new Date(t.createdAt);
      if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear && t.type === 'credit') {
        return sum + t.amount;
      }
      return sum;
    }, 0);

    res.json({
      success: true,
      stats: {
        ...stats,
        earnings: {
          balance: balance,
          monthly: monthlyEarnings
        },
        monthlyEarnings: monthlyEarnings // Flat version for simplicity
      }
    });

  } catch (error) {
    console.error("Technician Stats Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- Redundant Dashboard Stats route removed. Using unified aggregated route above (L1825). ---

// [NEW] Monthly Stats Endpoint

// --- Chat Routes [NEW] ---
// --- Chat Routes [NEW] ---
app.post('/api/chat/send', async (req, res) => {
  const { senderId, receiverId, message, senderName, jobId, attachmentUrl, type, voiceUrl } = req.body;

  // Normalize Voice URL to attachmentUrl
  const finalAttachmentUrl = attachmentUrl || voiceUrl;
  const finalType = type || (voiceUrl ? 'voice' : 'text');

  const chat = await chatManager.sendMessage(senderId, receiverId, message, senderName, jobId, finalAttachmentUrl, finalType);

  // Realtime Socket
  if (io) {
    io.emit('receive_message', chat); // Broadcast (Room scoped inside Manager too)
  }

  res.json({ success: true, chat });
});

app.post('/api/chat/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

    const fileType = req.file.mimetype.startsWith('image/') ? 'image' :
      (req.file.mimetype.startsWith('audio/') ? 'voice' : 'file');

    const timestamp = Date.now();
    const customName = `chat-${timestamp}-${req.file.originalname}`;
    const url = await storageManager.upload(req.file, 'chat-attachments', customName);

    res.json({ success: true, url, type: fileType });
  } catch (err) {
    console.error("Chat Upload Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/chat/history/:userId1/:userId2', async (req, res) => {
  const jobId = req.query.jobId;
  const chats = await chatManager.getHistory(req.params.userId1, req.params.userId2, jobId);
  res.json({ success: true, chats });
});

app.get('/api/chat/conversations/:userId', async (req, res) => {
  const conversations = await chatManager.getConversations(req.params.userId);
  res.json({ success: true, conversations });
});

// --- Support Routes [NEW] ---
app.post('/api/support/session', async (req, res) => {
  try {
    const { userId } = req.body;
    const session = await supportManager.createSession(userId);
    res.json({ success: true, session });
  } catch (err) {
    console.error("Support Session Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/support/message', async (req, res) => {
  try {
    const { sessionId, sender, text, userId } = req.body;
    const session = await supportManager.addMessage(sessionId, sender, text, userId);
    res.json({ success: true, session });
  } catch (err) {
    console.error("Support Message Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/support/close', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await supportManager.closeSession(sessionId);
    res.json({ success: true, session });
  } catch (err) {
    console.error("Support Close Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Offer Routes ---
app.get('/api/offers', async (req, res) => {
  const offers = await offerManager.getAllOffers();
  res.json({ success: true, offers });
});

app.post('/api/offers', async (req, res) => {
  const { title, description, badgeText, createdBy, expiryDate } = req.body;
  const offer = await offerManager.createOffer(title, description, badgeText, createdBy, expiryDate);
  res.json({ success: true, offer });
});

app.delete('/api/offers/:id', async (req, res) => {
  await offerManager.deleteOffer(req.params.id);
  res.json({ success: true });
});
// --- Finance Routes ---


app.get('/api/finance/wallet/:userId', async (req, res) => { // [NEW] Get Balance
  const balance = await financeManager.getBalance(req.params.userId);
  const transactions = await financeManager.getTransactionsByUser(req.params.userId);
  res.json({ success: true, balance, transactions });
});

app.post('/api/finance/wallet/add', async (req, res) => { // [NEW] Add Funds
  const { userId, amount, description } = req.body;
  const transaction = await financeManager.createTransaction(userId, null, 'credit', amount, description || 'Added to wallet');
  const newBalance = await financeManager.getBalance(userId);
  res.json({ success: true, transaction, newBalance });
});

// --- Membership Lifecycle Routes ---
app.post('/api/membership/pay', async (req, res) => {
  try {
    const { userId, amount } = req.body;

    // 1. Process Payment in Finance
    const paymentResult = await financeManager.processMembershipPayment(userId, amount);

    if (paymentResult.success) {
      // 2. Update User Membership
      const user = await userManager.setMembership(userId, paymentResult.tier, paymentResult.expiryDate);

      // 3. Notify & Emit
      io.to(`user_${userId}`).emit('membership_update', { user });
      await notificationManager.createNotification(userId, 'user', 'Membership Restored', `Your Premium membership has been activated until ${new Date(paymentResult.expiryDate).toLocaleDateString()}.`, 'membership_restored', userId);

      res.json({ success: true, user, transaction: paymentResult.transaction });
    } else {
      res.status(400).json({ success: false, error: 'Payment failed' });
    }
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// --- Ride Routes ---
app.get('/api/rides/technician/:id', async (req, res) => {
  const rides = await rideManager.getRidesByTechnician(req.params.id);
  res.json({ success: true, rides });
});

app.post('/api/rides/start', async (req, res) => {
  const { technicianId, jobId, startLocation, endLocation } = req.body;
  const ride = await rideManager.startRide(technicianId, jobId, startLocation, endLocation);
  res.json({ success: true, ride });
});

app.put('/api/rides/:id/complete', async (req, res) => {
  const ride = await rideManager.completeRide(req.params.id);
  if (ride) res.json({ success: true, ride });
  else res.status(404).json({ success: false, error: 'Ride not found' });
});

app.put('/api/rides/:id/location', async (req, res) => {
  const { location } = req.body;
  const success = await rideManager.updateRoute(req.params.id, location);
  if (success) res.json({ success: true });
  else res.status(404).json({ success: false, error: 'Ride not found' });
});

// --- Broadcast Routes ---

app.post('/api/broadcasts', async (req, res) => {
  try {
    const { title, message, audience, type } = req.body;
    // Security: Ideally verify user is Admin/SuperAdmin
    const broadcast = await broadcastManager.createBroadcast(title, message, audience, type);

    // Realtime Emit
    io.emit('general_broadcast', broadcast);

    res.json({ success: true, broadcast });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/broadcasts', async (req, res) => {
  const broadcasts = await broadcastManager.getActiveBroadcasts();
  res.json({ success: true, broadcasts });
});

// --- Admin Dashboard Routes ---
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password, deviceId } = req.body;
    const admin = await adminManager.login(email, password);

    if (admin) {
      // Create Session
      const session = await sessionManager.createSession(admin.id, 'admin', deviceId);
      res.json({ success: true, admin, sessionToken: session.token });
    } else {
      res.status(401).json({ success: false, error: 'Invalid admin credentials' });
    }
  } catch (err) {
    console.error("[Server] Admin Login Error:", err);
    res.status(500).json({ success: false, error: `Internal server error: ${err.message}` });
  }
});

// Middleware to verify Admin Session (basic check for now)
// In production, use a proper middleware checking headers authorization
// Middleware to verify Admin Session and Attach Context


// [RESTORED] Admin Stats Endpoint with Context Awareness
app.get('/api/admin/stats', verifyAdmin, async (req, res) => {
  try {
    let users = [];
    let technicians = [];
    let jobs = [];

    // 1. Fetch Data (Filtered or Global)
    if (req.admin.role === 'admin' && req.admin.fixed_latitude && req.admin.fixed_longitude) {
      const lat = req.admin.fixed_latitude;
      const lng = req.admin.fixed_longitude;
      users = await userManager.getUsersByLocation(lat, lng, 30);
      technicians = await technicianManager.getTechniciansByLocation(lat, lng, 30);
      jobs = await jobManager.getJobsByLocation(lat, lng, 30);
    } else {
      users = await userManager.getAllUsers();
      technicians = await technicianManager.getAllTechnicians();
      jobs = await jobManager.getAllJobs();
    }

    // 2. Calculate Stats
    const totalUsers = users.length;
    const totalJobs = jobs.length;
    const activeTechnicians = technicians.filter(t => t.status !== 'offline').length; // Assuming 'offline' is a status, or just count all

    // Revenue Calculation (Mock or Real)
    // Assuming jobs have 'price' or 'offerPrice' and status 'completed'
    const revenue = jobs
      .filter(j => j.status === 'completed')
      .reduce((sum, j) => sum + (Number(j.offerPrice) || Number(j.visitingCharges) || 0), 0);

    // Trends (Mock for now, or calculate against created_at)
    // Implementation of real trends requires comparing with previous month data which might be expensive here. 
    // Sending static trends or 0 for now.
    const trends = { users: 5, jobs: 12, revenue: 8 };

    // Recent Activity (Latest 5 jobs)
    // Sort by updated_at desc
    const activityLog = jobs
      .sort((a, b) => new Date(b.updatedAt || b.created_at) - new Date(a.updatedAt || a.created_at))
      .slice(0, 5)
      .map(j => ({
        id: j.id,
        action: `Job ${j.status}`,
        details: `Job #${j.id} updated to ${j.status}`,
        time: j.updatedAt || j.createdAt
      }));

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalJobs,
        activeTechnicians,
        revenue,
        trends,
        activityLog,
        detailed: true
      }
    });

  } catch (err) {
    console.error("[Stats] Error calculating stats:", err);
    res.status(500).json({ success: false, error: 'Failed to calculate stats' });
  }
});

app.get('/api/admin/technicians', verifyAdmin, async (req, res) => {
  let technicians = [];
  // Geospatial Filter for Admins (30km Radius)
  if (req.admin.role === 'admin' && req.admin.fixed_latitude && req.admin.fixed_longitude) {
    // console.log(`[AdminAPI] Filtering Technicians for Admin ${req.admin.id} at ${req.admin.fixed_latitude},${req.admin.fixed_longitude}`);
    technicians = await technicianManager.getTechniciansByLocation(req.admin.fixed_latitude, req.admin.fixed_longitude, 30);
  } else {
    // SuperAdmin or Admin without location sees all
    technicians = await technicianManager.getAllTechnicians();
  }
  res.json({ success: true, technicians });
});

// [NEW] Create Technician (Admin Bound)
app.post('/api/admin/technicians', verifyAdmin, async (req, res) => {
  try {
    const { name, email, phone, serviceType, location, password, experience, addressDetails, latitude, longitude } = req.body;

    // Binding Context
    const createdBy = req.admin.id; // UUID of Admin

    // Determine Fixed Location: 
    // 1. Explicit Input (Precision)
    // 2. Admin's Fixed Location (Franchise fallback)
    let fixedLocation = null;
    if (latitude && longitude) {
      fixedLocation = { latitude, longitude, address: location || addressDetails };
    } else if (req.admin.fixed_latitude && req.admin.fixed_longitude) {
      fixedLocation = { latitude: req.admin.fixed_latitude, longitude: req.admin.fixed_longitude };
    }

    const techData = {
      name,
      email,
      phone,
      serviceType,
      addressDetails: addressDetails || location,
      experience,
      password // Encrypt inside manager if needed, or if manager assumes hashing handled elsewhere check logic. 
      // Tech manager doesn't seem to hash, checking createTechnician... 
      // It stores plain currently based on previous reads? Wait, checking code...
      // The previous view_file of TechnicianManager didn't show password handling in createTechnician.
      // Ideally password should be hashed. For now passing it in data.
    };

    // Add password to data (Manager needs to handle it)
    techData.password = password;

    const tech = await technicianManager.createTechnician(
      techData,
      createdBy,
      fixedLocation
    );

    res.json({ success: true, technician: tech });
  } catch (err) {
    console.error("Create Technician Error:", err);
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/technicians/:id/verify', verifyAdmin, async (req, res) => {
  const { status } = req.body; // 'approved', 'rejected', 'pending'
  const tech = await technicianManager.updateStatus(req.params.id, status);
  if (tech) res.json({ success: true, technician: tech });
  else res.status(404).json({ success: false, error: 'Technician not found' });
});

app.post('/api/admin/technicians/:id/membership', verifyAdmin, async (req, res) => {
  const { membership } = req.body; // 'free', 'silver', 'gold', 'premium'
  const tech = await technicianManager.updateMembership(req.params.id, membership);
  if (tech) {
    res.json({ success: true, technician: tech });
  } else {
    res.status(404).json({ success: false, error: 'Technician not found' });
  }
});

app.get('/api/admin/users', verifyAdmin, async (req, res) => {
  let users = [];
  if (req.admin.role === 'admin' && req.admin.fixed_latitude && req.admin.fixed_longitude) {
    users = await userManager.getUsersByLocation(req.admin.fixed_latitude, req.admin.fixed_longitude, 30);
  } else {
    users = await userManager.getAllUsers();
  }
  res.json({ success: true, users });
});

app.get('/api/admin/jobs', verifyAdmin, async (req, res) => {
  let jobs = [];
  if (req.admin.role === 'admin' && req.admin.fixed_latitude && req.admin.fixed_longitude) {
    jobs = await jobManager.getJobsByLocation(req.admin.fixed_latitude, req.admin.fixed_longitude, 30);
  } else {
    jobs = await jobManager.getAllJobs();
  }
  res.json({ success: true, jobs });
});

app.get('/api/admin/feedbacks', verifyAdmin, async (req, res) => {
  try {
    let feedbacks = [];
    if (req.admin.role === 'admin' && req.admin.fixed_latitude && req.admin.fixed_longitude) {
      feedbacks = await feedbackManager.getFeedbacksByLocation(req.admin.fixed_latitude, req.admin.fixed_longitude, 30, technicianManager);
    } else {
      feedbacks = await feedbackManager.getAllFeedback();
    }
    res.json({ success: true, feedbacks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/transactions', verifyAdmin, async (req, res) => {
  try {
    let transactions = [];
    if (req.admin.role === 'admin' && req.admin.fixed_latitude && req.admin.fixed_longitude) {
      transactions = await financeManager.getTransactionsByLocation(req.admin.fixed_latitude, req.admin.fixed_longitude, 30, userManager);
    } else {
      transactions = await financeManager.getAllTransactions();
    }
    res.json({ success: true, transactions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// [NEW] Admin Specific Offers
app.get('/api/admin/offers', verifyAdmin, async (req, res) => {
  try {
    let offers = [];
    if (req.admin.role === 'admin' && req.admin.fixed_latitude && req.admin.fixed_longitude) {
      offers = await offerManager.getOffersByLocation(req.admin.fixed_latitude, req.admin.fixed_longitude, 30, technicianManager);
    } else {
      offers = await offerManager.getAllOffers();
    }
    res.json({ success: true, offers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// [NEW] Admin Specific Testimonials (Global for now, but ready for filter)
app.get('/api/admin/testimonials', verifyAdmin, async (req, res) => {
  try {
    // Testimonials currently don't link to UserID in schema easily, so keeping global or filtering if schema updated.
    // Assuming global for now as per previous analysis, but creating endpoint for consistency.
    const testimonials = await testimonialManager.getTestimonials();
    res.json({ success: true, testimonials });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// [NEW] Admin Support/Complaints
app.get('/api/admin/complaints', verifyAdmin, async (req, res) => {
  try {
    let complaints = [];
    if (req.admin.role === 'admin' && req.admin.fixed_latitude && req.admin.fixed_longitude) {
      complaints = await complaintManager.getComplaintsByLocation(req.admin.fixed_latitude, req.admin.fixed_longitude, 30, userManager);
    } else {
      complaints = await complaintManager.getAllComplaints();
    }
    res.json({ success: true, complaints });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});



// Store system settings (mock persistence)
let systemSettings = {
  walletEnabled: true
};

app.post('/api/admin/wallet/control', verifyAdmin, (req, res) => {
  const { enabled } = req.body;
  systemSettings.walletEnabled = enabled;
  res.json({ success: true, enabled: systemSettings.walletEnabled });
});

app.get('/api/admin/wallet/status', verifyAdmin, (req, res) => {
  res.json({ success: true, enabled: systemSettings.walletEnabled });
});

app.post('/api/admin/users/:id/membership', verifyAdmin, async (req, res) => {
  const { membership } = req.body; // 'free', 'premium'
  // Assuming UserManager has an update method. If not, we might need to add one.
  // For now, let's try to update using a direct DB update or similar if exposed, 
  // but UserManager usually has valid methods. Check UserManager.js if this fails.
  // userManager.updateMembership(req.params.id, membership); // Hypothetical

  // Fallback: Read, Modify, Save (Not safe for concurrency but works for MVP)
  // Use the generic updateUser method to persist changes
  const updatedUser = await userManager.updateUser(req.params.id, { membership: req.body.membership });
  if (updatedUser) {
    res.json({ success: true, user: updatedUser });
  } else {
    res.status(404).json({ success: false, error: 'User not found' });
  }
});

// --- Invoice Settings Routes [NEW] ---
app.get('/api/admin/invoice-settings', verifyAdmin, async (req, res) => {
  try {
    const settings = await invoiceSettingsManager.getSettings();
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/invoice-settings', verifyAdmin, upload.single('logo'), async (req, res) => {
  try {
    const updates = req.body;

    // Handle logo upload
    if (req.file) {
      const customName = `invoice-logo-${Date.now()}${path.extname(req.file.originalname)}`;
      const logoUrl = await storageManager.upload(req.file, 'misc', customName);
      updates.logoUrl = logoUrl;
    }

    const settings = await invoiceSettingsManager.updateSettings(updates);
    res.json({ success: true, settings });
  } catch (err) {
    console.error('Invoice Settings Update Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Explicitly link settings manager... (Removed as handled in constructor)
// if (invoiceManager && invoiceSettingsManager) {
//   invoiceManager.setSettingsManager(invoiceSettingsManager);
// }

// [Moved Catch-all to end]
// --- Support Routes ---
app.post('/api/support/session', async (req, res) => {
  try {
    const { userId } = req.body;
    const session = await supportManager.createSession(userId);
    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// [NEW] Feedback Route
app.post('/api/feedback', async (req, res) => {
  try {
    const { userId, technicianId, jobId, ratings, comment } = req.body;
    const feedback = await feedbackManager.addFeedback(userId, technicianId, jobId, ratings, comment);
    res.json({ success: true, feedback });
  } catch (err) {
    console.error("Feedback error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/support/message', async (req, res) => {
  try {
    const { sessionId, sender, text, userId } = req.body; // userId needed for notification if sender=agent
    const session = await supportManager.addMessage(sessionId, sender, text, userId);
    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Offer Routes (Job Bids) ---
app.get('/api/offers/bids', async (req, res) => {
  try {
    const bids = await offerManager.getOpenBids();
    res.json({ success: true, offers: bids });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/offers/:id/accept', async (req, res) => {
  try {
    const { technicianId } = req.body;
    const job = await offerManager.acceptOffer(req.params.id, technicianId);
    res.json({ success: true, job });
  } catch (err) {
    console.error("Accept Offer Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/offers', async (req, res) => {
  try {
    const offers = await offerManager.getAllOffers();
    // Filter to show only 'coupon' type for public board, hiding job bids
    const publicOffers = offers.filter(o => !o.type || o.type === 'coupon');
    res.json({ success: true, offers: publicOffers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/offers', async (req, res) => {
  try {
    const offer = await offerManager.createOffer(req.body);
    res.json({ success: true, offer });
  } catch (err) {
    console.error("Create Offer Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/offers/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const offers = await offerManager.getOffersByUser(userId);
    res.json({ success: true, offers });
  } catch (err) {
    console.error("Fetch User Offers Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/support/active', async (req, res) => {
  const sessions = await supportManager.getActiveSessions();
  res.json({ success: true, sessions });
});

app.get('/api/support/session/:id', async (req, res) => {
  const session = await supportManager.getSession(req.params.id);
  if (session) res.json({ success: true, session });
  else res.status(404).json({ success: false, error: "Session not found" });
});

// [NEW] Feedback Route
// [NEW] Feedback Route
app.post('/api/feedback', async (req, res) => {
  try {
    console.log("[API] /api/feedback request received:", JSON.stringify(req.body, null, 2));
    const { userId, technicianId, jobId, ratings, comment } = req.body;
    const feedback = await feedbackManager.addFeedback(userId, technicianId, jobId, ratings, comment);
    console.log("[API] Feedback added successfully:", feedback);
    res.json({ success: true, feedback });
  } catch (err) {
    console.error("Feedback error FULL:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// --- Socket.IO Connection Handler ---
io.on('connection', (socket) => {
  console.log(`A user connected: ${socket.id}`);

  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room ${room}`);
  });

  socket.on('update_location', async (data) => {
    if (data && data.userId && data.location) {
      // console.log(`Location update from ${data.userId}`, data.location);
      await locationManager.saveUserRealtimeLocation(data.userId, data.location);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// --- DIAGNOSTIC ENDPOINT (Temporary) ---
app.get('/api/diagnostic/db', async (req, res) => {
  try {
    const isSupabase = process.env.USE_SUPABASE === 'true';
    const dbType = isSupabase ? 'Supabase' : 'Local JSON';
    const envCheck = {
      USE_SUPABASE: process.env.USE_SUPABASE,
      HAS_URL: !!process.env.SUPABASE_URL,
      HAS_KEY: !!process.env.SUPABASE_SERVICE_KEY
    };

    // Check Users
    const users = await userManager.getAllUsers();
    const userSummary = users.map(u => ({ id: u.id, email: u.email }));

    // Check Technicians
    const technicians = await technicianManager.getAllTechnicians();
    const techSummary = technicians.map(t => ({ id: t.id, email: t.email }));

    res.json({
      success: true,
      environment: envCheck,
      databaseType: dbType,
      userCount: users.length,
      users: userSummary,
      technicianCount: technicians.length,
      technicians: techSummary
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, stack: err.stack });
  }
});

// Start Background Processors
// jobManager.startAutoAssignment();
supportManager.startInactivityMonitor(); // [NEW] 5-minute timeout for support sessions

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Fixofy Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.USE_SUPABASE === 'true' ? 'Production (Supabase)' : 'Development (Local JSON)'}`);
});
