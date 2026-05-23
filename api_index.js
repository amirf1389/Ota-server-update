require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const app = express();

// 1. Middleware Setup
app.use(cors());
app.use(express.json());

// 2. Serverless File Upload Config (Memory Storage)
// Prevents local disk writes, holding data in RAM before passing to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 3. Cloudinary Config 
// Automatically picks up CLOUDINARY_URL from Vercel's Environment Variables
cloudinary.config({
    secure: true
});

// 4. Security Auth Middleware
const authenticateOTA = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const EXPECTED_TOKEN = process.env.OTA_API_KEY || 'Bearer ota_sec_9948271xaa_fleet_master';

    if (!authHeader || authHeader !== EXPECTED_TOKEN) {
        return res.status(403).json({ error: "Unauthorized: Invalid or missing API Key" });
    }
    next();
};

// ==========================================
// FRONTEND DASHBOARD ENDPOINTS
// ==========================================

// GET: Unlimited Media Library
app.get('/api/movies', (req, res) => {
    const movies = [
        { id: 1, title: "Highway Drift", year: 2024, duration: "1h 55m", genre: "Action", status: "Unlimited", size: "12.4 GB" },
        { id: 2, title: "The Midnight Passenger", year: 2023, duration: "2h 10m", genre: "Thriller", status: "Unlimited", size: "18.1 GB" },
        { id: 3, title: "Comedy Tour Special", year: 2025, duration: "1h 20m", genre: "Comedy", status: "Unlimited", size: "8.8 GB" },
        { id: 4, title: "Nature Scapes: Mountains", year: 2022, duration: "45m", genre: "Documentary", status: "Unlimited", size: "22.0 GB" },
        { id: 5, title: "Animated Adventures", year: 2024, duration: "1h 30m", genre: "Kids", status: "Unlimited", size: "9.5 GB" }
    ];
    res.json(movies);
});

// POST: Direct Upload to Cloudinary CDN
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file provided." });
    }

    // Auto-detect video/audio vs image for Cloudinary processing
    let resourceType = 'auto';
    if (req.file.mimetype.startsWith('video/') || req.file.mimetype.startsWith('audio/')) {
        resourceType = 'video';
    }

    // Stream the RAM buffer directly to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
        {
            folder: "ota-media-library",
            resource_type: resourceType,
            public_id: req.file.originalname.split('.')[0]
        },
        (error, result) => {
            if (error) {
                console.error("Cloudinary Upload Error:", error);
                return res.status(500).json({ error: "Failed to upload to Cloudinary CDN" });
            }

            res.json({
                status: "success",
                message: "File injected into Cloudinary CDN successfully.",
                filename: result.original_filename,
                format: result.format,
                size: result.bytes,
                cdnUrl: result.secure_url,
                playbackUrl: result.playback_url
            });
        }
    );

    // Finalize and execute the stream transfer
    uploadStream.end(req.file.buffer);
});

// ==========================================
// SECURE CLOUD MESH ENDPOINTS
// ==========================================

// POST: Secure Mesh Handshake
app.post('/v2/secure', authenticateOTA, (req, res) => {
    res.json({
        status: "in-sync",
        nodeId: req.body.nodeId || "NODE-UNKNOWN",
        globalVersion: "v2.5.2-stable",
        action: "Mesh synchronization authorized."
    });
});

// ==========================================
// WEBHOOK CALLBACK ENGINE
// ==========================================

// POST: Status Webhook Endpoint
app.post('/v2/callbacks/ota', (req, res) => {
    const payload = req.body;
    
    // Serverless functions print console.log directly to the Vercel Logs dashboard
    console.log("------------------------------------------------");
    console.log(`[WEBHOOK RECEIVED] Event: ${payload.event || 'OTA_UPDATE'}`);
    console.log(`Node: ${payload.nodeId}`);
    console.log(`Status: ${payload.status}`);
    console.log("------------------------------------------------");
    
    // 200 OK prevents the webhook sender from retrying the post
    res.status(200).json({ received: true, timestamp: new Date().toISOString() });
});

// Export the Express API for the Vercel serverless environment
module.exports = app;