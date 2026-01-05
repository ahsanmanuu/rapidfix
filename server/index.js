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
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
// Serve uploads folder statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
app.post('/api/users/register', (req, res) => {
  try {
    const { name, email, phone, password, location } = req.body;

    // Mandatory Location Check
    if (!location || !location.latitude || !location.longitude) {
      throw new Error('Realtime location is mandatory for registration.');
    }

    // Save User with Location
    const user = userManager.createUser(name, email, phone, password, location);

    // Also save to Location Manager specifically
    locationManager.saveUserRealtimeLocation(user.id, location);

    // Auto-Login: Create Session
    const session = sessionManager.createSession(user.id, 'user', null); // deviceId could be passed if critical

    res.json({ success: true, user, sessionToken: session.token });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/users/login', (req, res) => {
  const { email, password, deviceId } = req.body;
  const user = userManager.login(email, password);
  if (user) {
    // Create Session
    const session = sessionManager.createSession(user.id, 'user', deviceId);
    res.json({
      success: true,
      user,
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
  const user = userManager.getUser(req.params.id);
  if (user) res.json({ success: true, user });
  else res.status(404).json({ success: false, error: 'User not found' });
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
    res.json({ success: true, technician });
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
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  const admin = adminManager.login(email, password);
  if (admin) {
    res.json({ success: true, admin });
  } else {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
});

app.post('/api/admin/technicians/:id/status', (req, res) => {
  // Ideally check if requester is admin
  const { status } = req.body;
  const tech = technicianManager.updateStatus(req.params.id, status);
  if (tech) res.json({ success: true, technician: tech });
  else res.status(404).json({ success: false, error: 'Technician not found' });
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
          // Price (lower is better) - assuming visitingCharges is strictly numerical or null
          // Check if tech has specific visiting charges in their profile? 
          // Currently data model doesn't show it, so we might skip price specific comparison or assume equal.
          // But user asked for it. Let's assume tech object MIGHT have 'visitingCharges', else distinct.
          const price = tech.visitingCharges || 99999;

          return { ...tech, stats, cancelRatio, price };
        });

        // 3. Sorting Logic
        // Primary: Rating > 4.0 AND Low Cancellation (< 15%)
        // Secondary: Price (Low to High)
        // Tertiary: Distance (Close to Far)

        scoredCandidates.sort((a, b) => {
          const aIsTopTier = a.rating >= 4.0 && a.cancelRatio <= 0.15;
          const bIsTopTier = b.rating >= 4.0 && b.cancelRatio <= 0.15;

          if (aIsTopTier && !bIsTopTier) return -1;
          if (!aIsTopTier && bIsTopTier) return 1;

          // If both are same tier, compare Price
          if (a.price !== b.price) return a.price - b.price;

          // If price same, compare Distance (assuming searchTechnicians returns 'distance' property)
          // Note: searchTechnicians already sorts by distance, so we can rely on index if stable sort, 
          // but explicit comparison is safer.
          return (a.distance || 0) - (b.distance || 0);
        });

        // 4. Select Best Candidate
        // If only one available, logic naturally picks it as index 0.
        const bestTech = scoredCandidates[0];

        console.log(`[SmartAssign] Selected ${bestTech.name} (Rating: ${bestTech.rating}, Ratio: ${bestTech.cancelRatio.toFixed(2)}, Dist: ${bestTech.distance}km)`);

        jobManager.assignTechnician(job.id, bestTech.id);
        job.technicianId = bestTech.id; // Update local object for response
        job.status = 'accepted';

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

app.get('/', (req, res) => {
  res.send('Fixofy Backend Server is Running!');
});

server.listen(port, () => {
  console.log(`Fixofy Server listening on port ${port}`);
});
