
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const dotenv   = require('dotenv');
const path     = require('path');
const fs       = require('fs');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// ── Middleware ──
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static Uploads Directory ──
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// ── Serve frontend static files from parent folder ──
const frontendPath = path.join(__dirname, '..');
app.use(express.static(frontendPath));

// ── API Routes ──
const issueRoutes = require('./routes/issueRoutes');
app.use('/api/issues', issueRoutes);

// ── Root → serves index.html ──
app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

async function startServer() {
    const primaryUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/civiceye';
    const fallbackUri = process.env.ATLAS_URI;

    try {
        console.log(`Connecting to MongoDB at: ${primaryUri}...`);
        await mongoose.connect(primaryUri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('✅ MongoDB Connected Successfully!');
        console.log('Database:', mongoose.connection.name);
        console.log('Host:', mongoose.connection.host);
    } catch (err) {
        console.warn('⚠️ Primary MongoDB connection failed:', err.message);
        if (fallbackUri && fallbackUri !== primaryUri) {
            console.log('Trying Atlas fallback connection...');
            try {
                await mongoose.connect(fallbackUri, {
                    serverSelectionTimeoutMS: 5000,
                });
                console.log('✅ Connected to MongoDB Atlas fallback!');
            } catch (fallbackErr) {
                console.error('❌ Fallback connection also failed:', fallbackErr.message);
            }
        }
    }

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`🚀 CivicEye Server running on http://localhost:${PORT}`);
        console.log(`🌐 Frontend available at: http://localhost:${PORT}`);
    });
}

startServer();
