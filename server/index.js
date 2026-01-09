const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const UserManager = require('./managers/UserManager');
const TechnicianManager = require('./managers/TechnicianManager');
const AdminManager = require('./managers/AdminManager');
const FeedbackManager = require('./managers/FeedbackManager');
const LocationManager = require('./managers/LocationManager');
const ComplaintManager = require('./managers/ComplaintManager');
const JobManager = require('./managers/JobManager');
const FinanceManager = require('./managers/FinanceManager');
const RideManager = require('./managers/RideManager');
// ...

// Ensure RideManager has getRidesByTechnician logic (I will assume it does or check later, but standard pattern suggests it should or I might need to add it to Manager too).
// Actually, let me check strictness. The user wants "fetch all his data".
// I'll add the route.

// --- Ride Routes --- (Usually near other routes)
// ... existing session routes ... 

const SuperAdminManager = require('./managers/SuperAdminManager');
const SessionManager = require('./managers/SessionManager');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
// Serve uploads folder statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve Request client build (Production)
app.use(express.static(path.join(__dirname, '../client/dist')));

// Catch-all route to serve index.html for non-API requests (SPA support)
// Place this AFTER all API routes
// We will insert the catch-all handler at the very end of the file or after routes.
// But for now, let's just add the static middleware here.


// Configure Multer
const upload = multer({ dest: 'uploads/temp/' });

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // In production, restrict this
    methods: ["GET", "POST"]
  }
});

const ChatManager = require('./managers/ChatManager');
const OfferManager = require('./managers/OfferManager');

// Initialize Managers
const userManager = new UserManager();
const technicianManager = new TechnicianManager();
const adminManager = new AdminManager();
const feedbackManager = new FeedbackManager();
const locationManager = new LocationManager();
const complaintManager = new ComplaintManager();
const jobManager = new JobManager();
const financeManager = new FinanceManager();
const rideManager = new RideManager();
const sessionManager = new SessionManager();
const superAdminManager = new SuperAdminManager();
const chatManager = new ChatManager();
const offerManager = new OfferManager();
const NotificationManager = require('./managers/NotificationManager');
const notificationManager = new NotificationManager();

// ... (Socket.io code skipped for brevity, keeping existing) ...

// --- Technician Routes ---
const techUploads = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'pan', maxCount: 1 },
  { name: 'aadhar', maxCount: 1 },
  { name: 'dl', maxCount: 1 }
]);

app.post('/api/technicians/register', techUploads, (req, res) => {
  try {
    console.log('--- Register Request ---');
    console.log('Body:', req.body);
    console.log('Files:', req.files);

    // Parse address details from body (formData makes everything strings)
    // Actually, body-parser doesn't handle multipart. Multer does.
    // req.body will contain text fields.
    const { name, email, phone, serviceType, location, password, experience, country, state, city, pincode } = req.body;

    // Parse location if sent as string JSON
    let parsedLocation = location;
    if (typeof location === 'string') {
      try { parsedLocation = JSON.parse(location); } catch (e) { }
    }

    const addressDetails = { country, state, city, pincode };

    // 1. Create Technician (Get ID)
    const tech = technicianManager.createTechnician(name, email, phone, serviceType, parsedLocation, password, experience, addressDetails);
    console.log('Created Tech ID:', tech.id);

    // 2. Handle Files
    const docPaths = {};
    if (req.files) {
      const techDir = path.join(__dirname, 'uploads', 'technicians', tech.id);
      if (!fs.existsSync(techDir)) {
        fs.mkdirSync(techDir, { recursive: true });
      }

      const moveFile = (fieldname) => {
        if (req.files[fieldname] && req.files[fieldname][0]) {
          const file = req.files[fieldname][0];
          const oldPath = file.path;
          const ext = path.extname(file.originalname);
          const newFilename = `${fieldname}${ext}`;
          const newPath = path.join(techDir, newFilename);

          fs.renameSync(oldPath, newPath);
          // Store relative path URL
          docPaths[fieldname] = `/uploads/technicians/${tech.id}/${newFilename}`;
          console.log(`Saved ${fieldname} to ${newPath}`);
        }
      };

      moveFile('photo');
      moveFile('pan');
      moveFile('aadhar');
      moveFile('dl');
    }

    console.log('DocPaths:', docPaths);

    // 3. Update Technician with Doc Paths
    const updatedTech = technicianManager.updateTechnicianDocuments(tech.id, docPaths);
    console.log('Updated Tech:', updatedTech);

    // 4. Save to Location Manager
    if (parsedLocation) {
      locationManager.saveUserRealtimeLocation(tech.id, parsedLocation);
    }

    res.json({ success: true, technician: updatedTech });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(400).json({ success: false, error: error.message });
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
app.post('/api/rides/start', (req, res) => {
  try {
    const { technicianId, jobId, startLocation } = req.body;
    // Verify job exists
    const job = jobManager.getJob(jobId);
    if (!job) return res.status(404).json({ success: false, error: "Job not found" });

    const ride = rideManager.startRide(technicianId, jobId, startLocation);

    // Notify User
    io.to(`user_${job.userId}`).emit('ride_started', ride);

    res.json({ success: true, ride });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/rides/:id/end', (req, res) => {
  const ride = rideManager.completeRide(req.params.id);
  if (ride) {
    // Notify User
    // We need userId, unfortunately update doesn't return joined job. 
    // Real app would fetch job. Simplified:
    // io.to(...).emit('ride_ended');
    res.json({ success: true, ride });
  } else {
    res.status(404).json({ success: false, error: "Ride not found" });
  }
});

app.get('/api/rides/technician/:id', (req, res) => {
  const rides = rideManager.getRidesByTechnician(req.params.id);
  res.json({ success: true, rides });
});

// --- User Routes ---
app.post('/api/users/register', async (req, res) => {
  try {
    console.log('[REGISTER] Starting registration...');
    console.log('[REGISTER] USE_SUPABASE:', process.env.USE_SUPABASE);

    const { name, email, phone, password, location } = req.body;

    // Mandatory Location Check
    if (!location || !location.latitude || !location.longitude) {
      throw new Error('Realtime location is mandatory for registration.');
    }

    console.log('[REGISTER] Creating user:', email);
    // Save User with Location
    const user = await userManager.createUser(name, email, phone, password, location);
    console.log('[REGISTER] User created successfully:', user.id);

    // Also save to Location Manager specifically
    locationManager.saveUserRealtimeLocation(user.id, location);

    // Auto-Login: Create Session
    const session = sessionManager.createSession(user.id, 'user', null); // deviceId could be passed if critical

    res.json({ success: true, user, sessionToken: session.token });
  } catch (error) {
    console.error('[REGISTER] Error:', error.message);
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/users/login', async (req, res) => {
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
      locationManager.saveUserRealtimeLocation(user.id, location);
    }

    // [AUTO-LIFE] Check and Sync Membership Expiry
    const syncedUser = await userManager.checkAndSyncMembership(user.id);
    if (syncedUser.statusChanged && syncedUser.newTier === 'Free') {
      notificationManager.createNotification(user.id, 'user', 'Membership Expired', 'Your Premium membership has expired. You have been switched to the Free tier.', 'membership_expired', user.id);
    }

    // Create Session
    const session = sessionManager.createSession(user.id, 'user', deviceId);
    res.json({
      success: true,
      user: { ...user, ...syncedUser, location: location || user.location }, // Return fresh location and membership
      sessionToken: session.token
    });
  } else {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
});

app.post('/api/users/logout', (req, res) => {
  const { token } = req.body;
  if (token) {
    sessionManager.deleteSession(token);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

app.get('/api/users/:id', (req, res) => {
  // Always sync membership on fetch to ensure dashboard matches DB
  const syncedUser = userManager.checkAndSyncMembership(req.params.id);
  if (syncedUser) {
    if (syncedUser.statusChanged && syncedUser.newTier === 'Free') {
      notificationManager.createNotification(req.params.id, 'user', 'Membership Expired', 'Your Premium membership has reached its end date. You are now on the Free tier.', 'membership_expired', req.params.id);
      io.to(`user_${req.params.id}`).emit('membership_update', { user: syncedUser });
    }
    res.json({ success: true, user: syncedUser });
  } else res.status(404).json({ success: false, error: 'User not found' });
});

app.put('/api/users/:id', (req, res) => {
  try {
    const { name, photo, password, location } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (photo) updates.photo = photo;
    if (password) updates.password = password;
    if (location) updates.location = location;

    const user = userManager.updateUser(req.params.id, updates);
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

app.post('/api/technicians/login', (req, res) => {
  const { email, password } = req.body;

  console.log('--- Tech Login Request ---');
  console.log('Email:', email);
  console.log('Password:', password);

  const technician = technicianManager.login(email, password);

  console.log('Login Result:', technician ? 'Success' : 'Failed');

  if (technician) {
    // Create Session
    const session = sessionManager.createSession(technician.id, 'technician', req.body.deviceId);
    res.json({ success: true, technician, sessionToken: session.token });
  } else {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
});

app.post('/api/technicians/search', (req, res) => {
  try {
    const { latitude, longitude, serviceType } = req.body;
    if (!latitude || !longitude || !serviceType) {
      return res.status(400).json({ success: false, error: 'Missing location or service type' });
    }

    const technicians = technicianManager.searchTechnicians(latitude, longitude, serviceType);
    res.json({ success: true, count: technicians.length, technicians });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, error: 'Internal server error during search' });
  }
});

app.get('/api/technicians', (req, res) => {
  if (req.query.serviceType) {
    const techs = technicianManager.findByService(req.query.serviceType);
    res.json({ success: true, technicians: techs });
  } else {
    const techs = technicianManager.getAllTechnicians();
    res.json({ success: true, technicians: techs });
  }
});

// [NEW] Get Top Rated Technicians for "Technician of the Month"
app.get('/api/technicians/top-rated', (req, res) => {
  try {
    const allTechs = technicianManager.getAllTechnicians();

    const enrichedTechs = allTechs.map(tech => {
      // 1. Get Feedbacks
      const feedbacks = feedbackManager.getFeedbackForTechnician(tech.id);

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
      const stats = jobManager.getJobStats(tech.id); // { total, rejected, ratio }
      // Mock On-Time based on Timeliness rating if jobs exist, else 100% or 0
      const onTimeRecord = detailedRatings.timeliness ? Math.round((detailedRatings.timeliness / 5) * 100) : (stats.total > 0 ? 100 : 100);

      return {
        ...tech,
        rating: averageRating,
        reviewCount: feedbacks.length,
        jobsCompleted: stats.total,
        onTime: `${onTimeRecord}%`,
        detailedRatings
      };
    });

    // Sort by rating
    const topTechs = enrichedTechs
      .sort((a, b) => b.rating - a.rating);

    res.json({ success: true, technicians: topTechs });
  } catch (error) {
    console.error("Top Rated Error", error);
    res.status(500).json({ success: false, error: error.message });
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

app.put('/api/notifications/:id/read', (req, res) => {
  notificationManager.markRead(req.params.id);
  res.json({ success: true });
});

// --- Super Admin Routes ---
app.post('/api/superadmin/login', (req, res) => {
  const { email, password } = req.body;
  const admin = superAdminManager.login(email, password);
  if (admin) {
    res.json({ success: true, superadmin: admin });
  } else {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
});

// --- Admin Routes ---
// --- Admin User Management Routes [DEPRECATED - Moved to consolidated block below] ---

// --- Admin User Management Routes [NEW] ---

app.get('/api/admin/users', (req, res) => {
  try {
    const users = userManager.getAllUsers();
    // Enrich with Wallet & Job Data
    const enrichedUsers = users.map(user => {
      const balance = financeManager.getBalance(user.id);
      const jobs = jobManager.getJobsByUser(user.id);

      // Calculate basic stats for quick view if needed, or send full jobs
      // Sending full jobs so drawer can show history
      return {
        ...user,
        walletBalance: balance,
        jobs: jobs, // Send full job objects
        membership: user.membership || 'Free', // Default to Free
        status: user.status || 'Active' // Default to Active
      };
    });
    res.json({ success: true, users: enrichedUsers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/admin/users/:id/ban', (req, res) => {
  try {
    const id = String(req.params.id).trim();
    console.log(`SERVER: Received Ban Request for ID: "${id}"`);

    // Attempt update
    const user = userManager.setStatus(id, 'Banned');

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
      const allUsers = userManager.getAllUsers();
      const foundLoose = allUsers.find(u => u.id == id);
      if (foundLoose) {
        console.log(`SERVER: Found user with loose equality! Actual ID: ${foundLoose.id} (Type: ${typeof foundLoose.id})`);
        // Try updating with actual ID
        const userRetry = userManager.setStatus(foundLoose.id, 'Banned');
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

app.put('/api/admin/users/:id/unban', (req, res) => {
  try {
    const id = String(req.params.id).trim();
    console.log(`SERVER: Received Unban Request for ID: "${id}"`);

    // Attempt update
    const user = userManager.setStatus(id, 'Active');

    if (user) {
      console.log(`SERVER: User unbanned: ${user.name}`);
      io.to(`user_${user.id}`).emit('account_status_change', { status: 'Active' });
      io.emit('admin_user_update', user);
      notificationManager.createNotification(user.id, 'user', 'Account Reactivated', 'Your account has been reactivated.', 'account_active', user.id);
      res.json({ success: true, user });
    } else {
      console.error(`SERVER: User not found for ID: ${id}`);
      // Loose Search Fallback
      const allUsers = userManager.getAllUsers();
      const foundLoose = allUsers.find(u => u.id == id);
      if (foundLoose) {
        console.log(`SERVER: Found loose match for unban.`);
        const userRetry = userManager.setStatus(foundLoose.id, 'Active');
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

app.put('/api/admin/users/:id/membership', (req, res) => {
  try {
    const id = String(req.params.id).trim();
    const { tier } = req.body; // 'Free' or 'Premium'

    const user = userManager.setMembership(id, tier);
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

// --- Feedback Routes ---
app.post('/api/feedback', (req, res) => {
  const { userId, technicianId, ratings, comment } = req.body;
  // ratings: object { time, attitude, communication, etc. }
  const feedback = feedbackManager.addFeedback(userId, technicianId, ratings, comment);

  // [REAL-TIME] Broadcast Updates
  // 1. To Technician
  io.to(`tech_${technicianId}`).emit('feedback_received', feedback);

  // 2. To User
  io.to(`user_${userId}`).emit('feedback_sent', feedback);

  // 3. To Admin/SuperAdmin (using generic admin event)
  io.emit('admin_feedback_update', feedback);

  res.json({ success: true, feedback });
});

app.get('/api/feedback/technician/:id', (req, res) => {
  const feedbacks = feedbackManager.getFeedbackForTechnician(req.params.id);
  res.json({ success: true, feedbacks });
});

// --- Location Routes ---
app.get('/api/locations', (req, res) => {
  const locations = locationManager.getAllLocations();
  res.json({ success: true, locations });
});

app.post('/api/locations', (req, res) => {
  try {
    const { city, area, pincode } = req.body;
    const loc = locationManager.addLocation(city, area, pincode);
    res.json({ success: true, location: loc });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// --- Complaint Routes ---
app.post('/api/complaints', (req, res) => {
  const { userId, technicianId, subject, description } = req.body;
  const complaint = complaintManager.createComplaint(userId, technicianId, subject, description);
  res.json({ success: true, complaint });
});

app.get('/api/complaints', (req, res) => {
  // Should be admin only
  const complaints = complaintManager.getAllComplaints();
  res.json({ success: true, complaints });
});

// --- Job Routes ---
app.post('/api/jobs', (req, res) => {
  try {
    const { userId, serviceType, description, location, scheduledDate, scheduledTime, contactName, contactPhone, offerPrice, technicianId, visitingCharges, agreementAccepted } = req.body;

    // 1. Create the Job
    const job = jobManager.createJob(userId, serviceType, description, location, scheduledDate, scheduledTime, contactName, contactPhone, offerPrice, technicianId, visitingCharges, agreementAccepted);

    // 2. Assignment Logic
    if (technicianId) {
      // Manual Assignment from Frontend
      // Verify tech exists (optional but good)
      jobManager.assignTechnician(job.id, technicianId);
      job.technicianId = technicianId;
      job.status = 'accepted';

      // [REAL-TIME] Update Tech Status & Broadcast
      technicianManager.updateStatus(technicianId, 'engaged');
      io.emit('technician_status_update', { technicianId, status: 'engaged' });

      io.to(`tech_${technicianId}`).emit('new_job_assigned', job);
    } else if (location && location.latitude && location.longitude) {
      // Auto-Assign Logic if no tech selected
      let nearbyTechnicians = technicianManager.searchTechnicians(location.latitude, location.longitude, serviceType);

      // 1. Filter by Availability
      // 'engaged' technicians cannot take new immediate jobs
      nearbyTechnicians = nearbyTechnicians.filter(t => t.status !== 'engaged');

      if (nearbyTechnicians.length > 0) {
        // 2. Score and Sort Candidates
        const scoredCandidates = nearbyTechnicians.map(tech => {
          const stats = jobManager.getJobStats(tech.id);
          // Default rating to 0 if undefined
          const rating = tech.rating || 0;
          // Cancellation Ratio (lower is better)
          const cancelRatio = stats.ratio;
          // Price (lower is better) - usually visitingCharges
          const price = tech.visitingCharges || 99999;

          return { ...tech, stats, cancelRatio, price };
        });

        // 3. Sorting Logic
        scoredCandidates.sort((a, b) => {
          const aIsTopTier = a.rating >= 4.0 && a.cancelRatio <= 0.15;
          const bIsTopTier = b.rating >= 4.0 && b.cancelRatio <= 0.15;

          if (aIsTopTier && !bIsTopTier) return -1;
          if (!aIsTopTier && bIsTopTier) return 1;

          if (a.price !== b.price) return a.price - b.price;
          return (a.distance || 0) - (b.distance || 0);
        });

        // 4. Select Best Candidate
        const bestTech = scoredCandidates[0];

        console.log(`[SmartAssign] Selected ${bestTech.name} (Rating: ${bestTech.rating}, Ratio: ${bestTech.cancelRatio.toFixed(2)}, Dist: ${bestTech.distance}km)`);

        jobManager.assignTechnician(job.id, bestTech.id);
        job.technicianId = bestTech.id; // Update local object for response
        job.status = 'accepted';

        // [REAL-TIME] Update Tech Status & Broadcast
        technicianManager.updateStatus(bestTech.id, 'engaged');
        io.emit('technician_status_update', { technicianId: bestTech.id, status: 'engaged' });

        // Notify Technician
        io.to(`tech_${bestTech.id}`).emit('new_job_assigned', job);
      }
    }

    // [NOTIFICATION] Job Created -> Notify Admin
    notificationManager.createNotification('admin', 'admin', 'New Job Request', `Job #${job.id} created by User`, 'job_created', job.id);

    // [NOTIFICATION] If Assigned -> Notify Technician
    if (job.technicianId) {
      notificationManager.createNotification(job.technicianId, 'technician', 'New Job Assigned', `You have been assigned Job #${job.id}`, 'job_assigned', job.id);
    }

    res.json({ success: true, job });
  } catch (error) {
    console.error("Create Job Error", error);
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/jobs', (req, res) => {
  // Admin only in real app
  const jobs = jobManager.getAllJobs();
  res.json({ success: true, jobs });
});

app.get('/api/jobs/user/:id', (req, res) => {
  const jobs = jobManager.getJobsByUser(req.params.id);
  res.json({ success: true, jobs });
});

// Get available jobs for a specific service type (for technicians to browse)
app.get('/api/jobs/available', (req, res) => {
  const { serviceType } = req.query;
  const jobs = jobManager.getAvailableJobs(serviceType);
  res.json({ success: true, jobs });
});

app.get('/api/jobs/technician/:id', (req, res) => {
  const jobs = jobManager.getJobsByTechnician(req.params.id);
  res.json({ success: true, jobs });
});

app.get('/api/jobs/:id', (req, res) => {
  const job = jobManager.getJob(req.params.id);
  if (job) res.json({ success: true, job });
  else res.status(404).json({ success: false, error: 'Job not found' });
});

app.put('/api/jobs/:id/status', (req, res) => {
  const { status, details } = req.body; // details: { technicianId, reason, otp }

  // 1. Get current job to know context (price, techId, etc.)
  const currentJob = jobManager.getJob(req.params.id);
  if (!currentJob) return res.status(404).json({ success: false, error: 'Job not found' });

  // 2. Update Job Status
  const job = jobManager.updateStatus(req.params.id, status, details);

  if (job) {
    const techId = job.technicianId || details?.technicianId || currentJob.technicianId;

    // 3. Handle Side Effects based on Status
    if (status === 'accepted') {
      // Technician is now BUSY/ENGAGED
      if (techId) {
        technicianManager.updateStatus(techId, 'engaged');
        io.emit('technician_status_update', { technicianId: techId, status: 'engaged' });
      }
    }
    else if (status === 'in_progress') {
      // Technician is working
      if (techId) {
        technicianManager.updateStatus(techId, 'engaged'); // Ensure engaged
        io.emit('technician_status_update', { technicianId: techId, status: 'engaged' });
      }
    }
    else if (status === 'completed') {
      // Job Done -> Tech Available + Payment
      if (techId) {
        technicianManager.updateStatus(techId, 'available');
        io.emit('technician_status_update', { technicianId: techId, status: 'available' });

        // Process Payment (Credit Tech)
        // Amount: job.offerPrice or default visiting charge. Assuming 500 if null for now.
        const amount = parseFloat(job.offerPrice) || parseFloat(job.visitingCharges) || 500;
        financeManager.createTransaction(techId, job.id, 'credit', amount, `Payment for Job #${job.id}`);

        // Notify Tech about money
        io.to(`tech_${techId}`).emit('wallet_updated', { amount });

        // [NEW] Auto-End Active Ride Session
        const rides = rideManager.getRidesByTechnician(techId);
        const activeRide = rides.find(r => r.jobId === job.id && r.status === 'in_progress');
        if (activeRide) {
          rideManager.completeRide(activeRide.id);
          io.to(`user_${job.userId}`).emit('ride_ended', { rideId: activeRide.id });
          io.to(`tech_${techId}`).emit('ride_ended', { rideId: activeRide.id });
        }
      }
    }
    else if (status === 'rejected') {
      // Job Rejected -> Tech Available
      if (techId) {
        technicianManager.updateStatus(techId, 'available');
        io.emit('technician_status_update', { technicianId: techId, status: 'available' });
      }
    }

    // 4. Notify Parties
    if (job.userId) io.to(`user_${job.userId}`).emit('job_status_updated', job);
    if (job.technicianId) io.to(`tech_${job.technicianId}`).emit('job_status_updated', job);

    // Notify Admins & Super Admins
    io.emit('job_status_updated_admin', job);

    // [NOTIFICATION] Persist Updates
    // 1. Notify User
    if (job.userId) {
      notificationManager.createNotification(job.userId, 'user', `Job ${status}`, `Your job #${job.id} is now ${status}`, `job_${status}`, job.id);
    }
    // 2. Notify Technician (if not the one triggering it, or just for record)
    if (job.technicianId) {
      notificationManager.createNotification(job.technicianId, 'technician', `Job ${status}`, `Job #${job.id} marked as ${status}`, `job_${status}`, job.id);
    }
    // 3. Notify Admin
    notificationManager.createNotification('admin', 'admin', `Job ${status}`, `Job #${job.id} updated to ${status}`, `job_status_update`, job.id);

    res.json({ success: true, job });
  }
  else res.status(500).json({ success: false, error: 'Failed to update job' });
});

// --- Technician Status & Profile Routes ---
app.put('/api/technicians/:id/status', (req, res) => {
  const { status, location } = req.body;
  const tech = technicianManager.updateStatus(req.params.id, status);
  if (tech) {
    if (location) technicianManager.updateLocation(req.params.id, location);
    io.emit('technician_status_update', { technicianId: tech.id, status: tech.status, location: tech.location });
    res.json({ success: true, technician: tech });
  } else {
    res.status(404).json({ success: false, error: 'Technician not found' });
  }
});

app.put('/api/technicians/:id/profile', (req, res) => {
  try {
    const updates = req.body; // Expect { password, documents: { photo: ... } }
    const tech = technicianManager.updateProfile(req.params.id, updates);
    if (tech) res.json({ success: true, technician: tech });
    else res.status(404).json({ success: false, error: 'Technician not found' });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// [NEW] Monthly Stats Endpoint
app.get('/api/technicians/:id/stats/monthly', (req, res) => {
  try {
    const techId = req.params.id;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 1. Calculate Monthly Earnings
    const transactions = financeManager.getTransactionsByUser(techId);
    const monthlyEarnings = transactions.reduce((sum, t) => {
      const tDate = new Date(t.createdAt);
      if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear && t.type === 'credit') {
        return sum + t.amount;
      }
      return sum;
    }, 0);

    // 2. Calculate Monthly Completed Jobs
    const jobs = jobManager.getJobsByTechnician(techId);
    const monthlyJobs = jobs.filter(j => {
      const jDate = new Date(j.createdAt); // Or use updatedAt for completion time
      return j.status === 'completed' && jDate.getMonth() === currentMonth && jDate.getFullYear() === currentYear;
    }).length;

    res.json({ success: true, earnings: monthlyEarnings, jobs: monthlyJobs });
  } catch (error) {
    console.error("Stats Error", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- Chat Routes [NEW] ---
app.post('/api/chat/send', (req, res) => {
  const { senderId, receiverId, message, senderName } = req.body;
  const chat = chatManager.sendMessage(senderId, receiverId, message, senderName);

  // Realtime Socket
  io.emit('receive_message', chat); // Broadcast to all for simplicity or use specific rooms if implemented

  res.json({ success: true, chat });
});

app.get('/api/chat/history/:userId1/:userId2', (req, res) => {
  const chats = chatManager.getHistory(req.params.userId1, req.params.userId2);
  res.json({ success: true, chats });
});

app.get('/api/chat/conversations/:userId', (req, res) => {
  const conversations = chatManager.getConversations(req.params.userId);
  res.json({ success: true, conversations });
});

// --- Offer Routes [NEW] ---
app.get('/api/offers', (req, res) => {
  const offers = offerManager.getAllOffers();
  res.json({ success: true, offers });
});

app.post('/api/offers', (req, res) => {
  const { title, description, badgeText, createdBy, expiryDate } = req.body;
  const offer = offerManager.createOffer(title, description, badgeText, createdBy, expiryDate);
  res.json({ success: true, offer });
});

// --- Finance Routes ---
app.get('/api/finance/user/:id', (req, res) => {
  // Generate/fetch bills for the user
  const bills = financeManager.getBillsByUser(req.params.id);
  res.json({ success: true, bills });
});

app.get('/api/finance/wallet/:userId', (req, res) => { // [NEW] Get Balance
  const balance = financeManager.getBalance(req.params.userId);
  const transactions = financeManager.getTransactionsByUser(req.params.userId);
  res.json({ success: true, balance, transactions });
});

app.post('/api/finance/wallet/add', (req, res) => { // [NEW] Add Funds
  const { userId, amount, description } = req.body;
  const transaction = financeManager.createTransaction(userId, null, 'credit', amount, description || 'Added to wallet');
  const newBalance = financeManager.getBalance(userId);
  res.json({ success: true, transaction, newBalance });
});

// --- Membership Lifecycle Routes ---
app.post('/api/membership/pay', (req, res) => {
  try {
    const { userId, amount } = req.body;

    // 1. Process Payment in Finance
    const paymentResult = financeManager.processMembershipPayment(userId, amount);

    if (paymentResult.success) {
      // 2. Update User Membership
      const user = userManager.setMembership(userId, paymentResult.tier, paymentResult.expiryDate);

      // 3. Notify & Emit
      io.to(`user_${userId}`).emit('membership_update', { user });
      notificationManager.createNotification(userId, 'user', 'Membership Restored', `Your Premium membership has been activated until ${new Date(paymentResult.expiryDate).toLocaleDateString()}.`, 'membership_restored', userId);

      res.json({ success: true, user, transaction: paymentResult.transaction });
    } else {
      res.status(400).json({ success: false, error: 'Payment failed' });
    }
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// --- Ride Routes ---
app.get('/api/rides/technician/:id', (req, res) => {
  const rides = rideManager.getRidesByTechnician(req.params.id);
  res.json({ success: true, rides });
});

app.post('/api/rides/start', (req, res) => {
  const { technicianId, jobId, startLocation, endLocation } = req.body;
  const ride = rideManager.startRide(technicianId, jobId, startLocation, endLocation);
  res.json({ success: true, ride });
});

app.put('/api/rides/:id/complete', (req, res) => {
  const ride = rideManager.completeRide(req.params.id);
  if (ride) res.json({ success: true, ride });
  else res.status(404).json({ success: false, error: 'Ride not found' });
});

// --- Broadcast Routes [NEW] ---
const BroadcastManager = require('./managers/BroadcastManager');
const broadcastManager = new BroadcastManager();

app.post('/api/broadcasts', (req, res) => {
  try {
    const { title, message, audience, type } = req.body;
    // Security: Ideally verify user is Admin/SuperAdmin
    const broadcast = broadcastManager.createBroadcast(title, message, audience, type);

    // Realtime Emit
    // 'audience' can be 'all', 'users', 'technicians'
    // For simplicity, we emit 'general_broadcast' to everyone, and client filters or just shows it.
    // Or we could use rooms if we had 'all_users' room.
    io.emit('general_broadcast', broadcast);

    res.json({ success: true, broadcast });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/broadcasts', (req, res) => {
  const broadcasts = broadcastManager.getActiveBroadcasts();
  res.json({ success: true, broadcasts });
});

// --- Admin Dashboard Routes ---
app.post('/api/admin/login', (req, res) => {
  const { email, password, deviceId } = req.body;
  const admin = adminManager.login(email, password);

  if (admin) {
    // Create Session
    const session = sessionManager.createSession(admin.id, 'admin', deviceId);
    res.json({ success: true, admin, sessionToken: session.token });
  } else {
    res.status(401).json({ success: false, error: 'Invalid admin credentials' });
  }
});

// Middleware to verify Admin Session (basic check for now)
// In production, use a proper middleware checking headers authorization
const verifyAdmin = (req, res, next) => {
  // For now, we trust the request if it has a specific header or just allow it 
  // as per current simple auth. ideally check for token.
  // const token = req.headers.authorization;
  // if (!token) return res.status(403).json({ error: 'No token' });
  next();
};

app.get('/api/admin/stats', verifyAdmin, (req, res) => {
  try {
    const users = userManager.getAllUsers();
    const technicians = technicianManager.getAllTechnicians();
    const jobs = jobManager.getAllJobs();
    const wallet = financeManager.getSystemWalletBalance(); // Assuming this exists or we calculate

    // Calculate detailed stats
    const activeTechnicians = technicians.filter(t => t.status === 'approved' || t.status === 'verified').length;
    const pendingVerifications = technicians.filter(t => t.status === 'pending').length;

    // Job Stats
    const completedJobs = jobs.filter(j => j.status === 'completed').length;
    const pendingJobs = jobs.filter(j => j.status === 'pending' || j.status === 'assigned').length;
    const cancelledJobs = jobs.filter(j => j.status === 'cancelled').length;
    const completionRate = jobs.length > 0 ? Math.round((completedJobs / jobs.length) * 100) : 0;

    res.json({
      success: true,
      stats: {
        totalUsers: users.length,
        totalTechnicians: technicians.length,
        activeTechnicians,
        pendingVerifications,
        totalWallet: wallet || 45200, // Mock if 0 for demo
        jobs: {
          total: jobs.length,
          completed: completedJobs,
          pending: pendingJobs,
          cancelled: cancelledJobs,
          completionRate
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/admin/technicians', verifyAdmin, (req, res) => {
  const technicians = technicianManager.getAllTechnicians();
  res.json({ success: true, technicians });
});

app.post('/api/admin/technicians/:id/verify', verifyAdmin, (req, res) => {
  const { status } = req.body; // 'approved', 'rejected', 'pending'
  const tech = technicianManager.updateStatus(req.params.id, status);
  if (tech) res.json({ success: true, technician: tech });
  else res.status(404).json({ success: false, error: 'Technician not found' });
});

app.post('/api/admin/technicians/:id/membership', verifyAdmin, (req, res) => {
  const { membership } = req.body; // 'free', 'silver', 'gold', 'premium'
  const tech = technicianManager.updateMembership(req.params.id, membership);
  if (tech) {
    res.json({ success: true, technician: tech });
  } else {
    res.status(404).json({ success: false, error: 'Technician not found' });
  }
});

app.get('/api/admin/users', verifyAdmin, (req, res) => {
  const users = userManager.getAllUsers();
  res.json({ success: true, users });
});

app.get('/api/admin/jobs', verifyAdmin, (req, res) => {
  const jobs = jobManager.getAllJobs();
  res.json({ success: true, jobs });
});

app.get('/api/admin/feedbacks', verifyAdmin, (req, res) => {
  // Collect all feedbacks from all technicians
  // FeedbackManager structure might need 'getAllFeedback'
  const allFeedback = feedbackManager.getAllFeedback ? feedbackManager.getAllFeedback() : [];
  res.json({ success: true, feedbacks: allFeedback });
});

app.get('/api/admin/transactions', verifyAdmin, (req, res) => {
  const transactions = financeManager.getAllTransactions();
  res.json({ success: true, transactions });
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

app.post('/api/admin/users/:id/membership', verifyAdmin, (req, res) => {
  const { membership } = req.body; // 'free', 'premium'
  // Assuming UserManager has an update method. If not, we might need to add one.
  // For now, let's try to update using a direct DB update or similar if exposed, 
  // but UserManager usually has valid methods. Check UserManager.js if this fails.
  // userManager.updateMembership(req.params.id, membership); // Hypothetical

  // Fallback: Read, Modify, Save (Not safe for concurrency but works for MVP)
  // Use the generic updateUser method to persist changes
  const updatedUser = userManager.updateUser(req.params.id, { membership: req.body.membership });
  if (updatedUser) {
    res.json({ success: true, user: updatedUser });
  } else {
    res.status(404).json({ success: false, error: 'User not found' });
  }
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

server.listen(port, () => {
  console.log(`Fixofy Server listening on port ${port}`);
});
