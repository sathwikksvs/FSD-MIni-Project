
const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
    title:       { type: String, required: true },
    category:    { type: String, required: true },
    location:    { type: String, required: true },
    description: { type: String, default: 'No description provided.' },
    priority:    { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    status:      { type: String, enum: ['Reported', 'In Progress', 'Resolved'], default: 'Reported' },
    votes:       { type: Number, default: 0 },
    lat:         { type: Number, default: 16.55 },
    lng:         { type: Number, default: 81.52 },
    date:        { type: String, default: () => new Date().toISOString().split('T')[0] },
    imageUrl:    { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Issue', issueSchema);

