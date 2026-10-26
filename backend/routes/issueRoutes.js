
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const Issue = require('../models/Issue');

// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cloudinary photo storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'civiceye',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
    }
});

// Allow image files only
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter
});

// GET all issues
router.get('/', async (req, res) => {
    try {
        const issues = await Issue.find().sort({ createdAt: -1, date: -1 });
        res.json(issues);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST new issue
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const issueData = { ...req.body };

        // Save permanent Cloudinary URL
        if (req.file) {
            issueData.imageUrl = req.file.path;
        }

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

// UPDATE status
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['Reported', 'In Progress', 'Resolved'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
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
