const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '.env') });
const Issue = require('./models/Issue');

async function comprehensiveAudit() {
    console.log('====================================================');
    console.log('       CIVICEYE FULL-STACK SYSTEM AUDIT REPORT       ');
    console.log('====================================================\n');

    const results = {
        mongodbConnection: false,
        mongodbDatabaseName: '',
        documentCount: 0,
        serverRunning: false,
        apiGetIssues: false,
        apiPostIssue: false,
        apiVoteIssue: false,
        apiPatchStatus: false,
        apiDeleteIssue: false,
        uploadsDirExists: false,
        imageUploadServing: false,
        frontendPages: {}
    };

    // 1. Direct MongoDB Check
    try {
        const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/civiceye';
        await mongoose.connect(uri);
        results.mongodbConnection = mongoose.connection.readyState === 1;
        results.mongodbDatabaseName = mongoose.connection.name;
        results.documentCount = await Issue.countDocuments();
        console.log(`[1] DIRECT MONGODB DATABASE:`);
        console.log(`    - Connected: ${results.mongodbConnection ? '✅ YES' : '❌ NO'}`);
        console.log(`    - Database Name: "${results.mongodbDatabaseName}"`);
        console.log(`    - Stored Issues in MongoDB: ${results.documentCount} documents`);
        await mongoose.disconnect();
    } catch (err) {
        console.error('    - Direct MongoDB Error:', err.message);
    }

    // 2. HTTP Server & API Endpoints Check
    const BASE_URL = 'http://127.0.0.1:5000';
    try {
        console.log(`\n[2] BACKEND SERVER & REST API (at ${BASE_URL}):`);
        
        // GET /api/issues
        const getRes = await fetch(`${BASE_URL}/api/issues`);
        if (getRes.ok) {
            results.apiGetIssues = true;
            results.serverRunning = true;
            const issues = await getRes.json();
            console.log(`    - GET /api/issues: ✅ 200 OK (${issues.length} issues received)`);
        } else {
            console.log(`    - GET /api/issues: ❌ Status ${getRes.status}`);
        }

        // POST /api/issues (create temporary test issue)
        const postRes = await fetch(`${BASE_URL}/api/issues`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: '__AUDIT_TEST_ISSUE__',
                category: 'Road',
                location: 'Audit Test Location',
                description: 'Verifying end-to-end database write and read',
                priority: 'Low',
                status: 'Reported'
            })
        });
        const created = await postRes.json();
        if (postRes.ok && created._id) {
            results.apiPostIssue = true;
            console.log(`    - POST /api/issues: ✅ 201 Created (ID: ${created._id})`);

            // VOTE /api/issues/:id/vote
            const voteRes = await fetch(`${BASE_URL}/api/issues/${created._id}/vote`, { method: 'POST' });
            const voted = await voteRes.json();
            if (voteRes.ok && voted.votes === 1) {
                results.apiVoteIssue = true;
                console.log(`    - POST /api/issues/:id/vote: ✅ 200 OK (Votes incremented to ${voted.votes})`);
            }

            // PATCH /api/issues/:id/status
            const patchRes = await fetch(`${BASE_URL}/api/issues/${created._id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'In Progress' })
            });
            const patched = await patchRes.json();
            if (patchRes.ok && patched.status === 'In Progress') {
                results.apiPatchStatus = true;
                console.log(`    - PATCH /api/issues/:id/status: ✅ 200 OK (Status changed to "${patched.status}")`);
            }

            // DELETE /api/issues/:id
            const delRes = await fetch(`${BASE_URL}/api/issues/${created._id}`, { method: 'DELETE' });
            if (delRes.ok) {
                results.apiDeleteIssue = true;
                console.log(`    - DELETE /api/issues/:id: ✅ 200 OK (Cleaned up test issue)`);
            }
        }
    } catch (err) {
        console.error('    - API Endpoint Error:', err.message);
    }

    // 3. Static Uploads Folder & Photo Serving
    const uploadsPath = path.join(__dirname, 'uploads');
    results.uploadsDirExists = fs.existsSync(uploadsPath);
    console.log(`\n[3] PHOTO STORAGE & UPLOADS DIRECTORY:`);
    console.log(`    - Local folder "${uploadsPath}": ${results.uploadsDirExists ? '✅ EXISTS' : '❌ MISSING'}`);
    if (results.uploadsDirExists) {
        const files = fs.readdirSync(uploadsPath);
        console.log(`    - Files in uploads: ${files.length} uploaded photos`);
        if (files.length > 0) {
            const checkImgRes = await fetch(`${BASE_URL}/uploads/${files[0]}`);
            results.imageUploadServing = checkImgRes.ok;
            console.log(`    - Static photo HTTP serving (/uploads/${files[0]}): ${checkImgRes.ok ? '✅ 200 OK' : '❌ FAILED'}`);
        }
    }

    // 4. Frontend Pages Serving Check
    const pages = [
        { path: '/', label: 'Home Page (index.html)' },
        { path: '/issues.html', label: 'All Issues Page' },
        { path: '/report.html', label: 'Report Issue Page' },
        { path: '/map.html', label: 'Map View Page' },
        { path: '/dashboard.html', label: 'Dashboard Page' },
        { path: '/style.css', label: 'CSS Stylesheet' },
        { path: '/app.js', label: 'Frontend Application Logic' }
    ];
    console.log(`\n[4] FRONTEND PAGES & STATIC ASSETS:`);
    for (const page of pages) {
        try {
            const pageRes = await fetch(`${BASE_URL}${page.path}`);
            results.frontendPages[page.path] = pageRes.status;
            console.log(`    - ${page.label.padEnd(30)} -> HTTP ${pageRes.status} ${pageRes.ok ? '✅' : '❌'}`);
        } catch (e) {
            console.log(`    - ${page.label.padEnd(30)} -> ❌ Failed to fetch`);
        }
    }

    console.log('\n====================================================');
    const allPassed = results.mongodbConnection &&
                      results.serverRunning &&
                      results.apiGetIssues &&
                      results.apiPostIssue &&
                      results.apiVoteIssue &&
                      results.apiPatchStatus &&
                      results.apiDeleteIssue &&
                      results.uploadsDirExists;

    if (allPassed) {
        console.log('🎯 CONCLUSION: 100% HEALTHY! ALL SYSTEMS OPERATIONAL!');
    } else {
        console.log('⚠️ CONCLUSION: Some checks failed. See details above.');
    }
    console.log('====================================================\n');
}

comprehensiveAudit();
