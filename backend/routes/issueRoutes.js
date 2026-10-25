
const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const Issue = require('../models/Issue');

// Configure multer storage for issue photos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
        cb(null, 'issue-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files (JPG, PNG, WebP) are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});

// GET all issues (sorted newest first)
router.get('/', async (req, res) => {
    try {
        const issues = await Issue.find().sort({ createdAt: -1, date: -1 });
        res.json(issues);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST new issue (supports JSON or multipart/form-data with photo upload)
router.post('/', (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: `Upload error: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        const issueData = { ...req.body };

        // If file was uploaded via multer, save its relative URL path
        if (req.file) {
            issueData.imageUrl = `/uploads/${req.file.filename}`;
        }

        // Parse numerical fields if received via FormData (strings)
        if (issueData.lat) issueData.lat = parseFloat(issueData.lat);
        if (issueData.lng) issueData.lng = parseFloat(issueData.lng);
        if (issueData.votes) issueData.votes = parseInt(issueData.votes, 10);

        const issue = await Issue.create(issueData);
        res.status(201).json(issue);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// GET one issue
router.get('/:id', async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id);

        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        res.json(issue);
    } catch (err) {
        res.status(400).json({ message: 'Invalid issue ID' });
    }
});

// UPDATE issue
router.put('/:id', async (req, res) => {
    try {
        const issue = await Issue.findByIdAndUpdate(
            req.params.id,
            req.body,
            { returnDocument: 'after', runValidators: true }
        );

        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        res.json(issue);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// QUICK STATUS UPDATE (Reported / In Progress / Resolved)
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['Reported', 'In Progress', 'Resolved'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }

        const issue = await Issue.findByIdAndUpdate(
            req.params.id,
            { status },
            { returnDocument: 'after', runValidators: true }
        );

        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        res.json(issue);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE issue
router.delete('/:id', async (req, res) => {
    try {
        const issue = await Issue.findByIdAndDelete(req.params.id);

        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        res.json({ message: 'Issue deleted successfully' });
    } catch (err) {
        res.status(400).json({ message: 'Invalid issue ID' });
    }
});

// VOTE on issue
router.post('/:id/vote', async (req, res) => {
    try {
        const issue = await Issue.findByIdAndUpdate(
            req.params.id,
            { $inc: { votes: 1 } },
            { returnDocument: 'after' }
        );

        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        res.json(issue);
    } catch (err) {
        res.status(400).json({ message: 'Invalid issue ID' });
    }
});

module.exports = router;
