const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Issue = require('./models/Issue');

dotenv.config({ path: path.join(__dirname, '.env') });

const sampleIssues = [
    {
        title: 'Deep Pothole on MG Road near Metro',
        category: 'Road',
        location: 'MG Road, Near Metro Pillar 142',
        description: 'Large pothole causing vehicle damage and frequent two-wheeler accidents during peak hours.',
        priority: 'High',
        status: 'In Progress',
        votes: 24,
        lat: 16.545,
        lng: 81.523,
        date: '2026-10-21',
        imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=700&auto=format&fit=crop&q=80'
    },
    {
        title: 'Overflowing Community Garbage Bin',
        category: 'Garbage',
        location: 'Sector 4 Market Area',
        description: 'Trash has not been cleared for 4 days, causing foul smell and health hazard.',
        priority: 'High',
        status: 'Reported',
        votes: 19,
        lat: 16.551,
        lng: 81.528,
        date: '2026-10-22',
        imageUrl: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=700&auto=format&fit=crop&q=80'
    },
    {
        title: 'Drinking Water Pipeline Leakage',
        category: 'Water',
        location: 'Gandhi Nagar, 3rd Cross',
        description: 'Clean drinking water is continuously leaking onto the street from a broken main pipe.',
        priority: 'Medium',
        status: 'Reported',
        votes: 14,
        lat: 16.538,
        lng: 81.517,
        date: '2026-10-23',
        imageUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=700&auto=format&fit=crop&q=80'
    },
    {
        title: 'Non-functional Streetlights on Ring Road',
        category: 'Electricity',
        location: 'Outer Ring Road, Junction 5',
        description: 'Row of 6 consecutive streetlights are out, causing severe darkness and safety risks at night.',
        priority: 'High',
        status: 'In Progress',
        votes: 31,
        lat: 16.559,
        lng: 81.534,
        date: '2026-10-19',
        imageUrl: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=700&auto=format&fit=crop&q=80'
    },
    {
        title: 'Broken Park Bench and Fallen Tree Branch',
        category: 'Environment',
        location: 'Central Public Park, Jogging Track',
        description: 'Storm caused heavy tree branch to fall across track and damaged seating bench.',
        priority: 'Low',
        status: 'Resolved',
        votes: 7,
        lat: 16.542,
        lng: 81.521,
        date: '2026-10-18',
        imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=700&auto=format&fit=crop&q=80'
    },
    {
        title: 'Missing Manhole Cover on School Road',
        category: 'Safety',
        location: 'St. Mary High School Lane',
        description: 'Open storm drain posing imminent hazard to school children and pedestrians.',
        priority: 'High',
        status: 'Resolved',
        votes: 42,
        lat: 16.548,
        lng: 81.514,
        date: '2026-10-15',
        imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5703bc20d?w=700&auto=format&fit=crop&q=80'
    },
    {
        title: 'Low Water Pressure in Municipal Taps',
        category: 'Water',
        location: 'Nehru Colony Block B',
        description: 'Water pressure has been negligible for the past week during scheduled supply hours.',
        priority: 'Medium',
        status: 'In Progress',
        votes: 11,
        lat: 16.553,
        lng: 81.510,
        date: '2026-10-24'
    },
    {
        title: 'Traffic Signal Malfunction at Main Crossing',
        category: 'Safety',
        location: 'Clock Tower Intersection',
        description: 'Traffic signals blinking amber simultaneously leading to chaotic traffic jams.',
        priority: 'High',
        status: 'Reported',
        votes: 28,
        lat: 16.546,
        lng: 81.525,
        date: '2026-10-25',
        imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5703bc20d?w=700&auto=format&fit=crop&q=80'
    }
];

async function seed() {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/civiceye';
        await mongoose.connect(uri);
        console.log('Connected to MongoDB. Clearing and seeding realistic issues with photos...');
        await Issue.deleteMany({});
        const inserted = await Issue.insertMany(sampleIssues);
        console.log(`✅ Seeded ${inserted.length} realistic issues with photos successfully!`);
        await mongoose.disconnect();
    } catch (err) {
        console.error('❌ Seeding error:', err);
    }
}

seed();
