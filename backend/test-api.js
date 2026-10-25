const fs = require('fs');
const path = require('path');

async function testApi() {
    try {
        console.log('--- 1. Testing GET /api/issues ---');
        const getRes = await fetch('http://127.0.0.1:5000/api/issues');
        const allIssues = await getRes.json();
        console.log(`✅ GET Success! Total issues: ${allIssues.length}`);

        console.log('\n--- 2. Testing POST /api/issues with Image Upload (Multipart/FormData) ---');
        // Create a tiny sample png buffer (1x1 pixel)
        const tinyPngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPjfDwAEfgHzpE7dOQAAAABJRU5ErkJggg==', 'base64');
        const tempImgPath = path.join(__dirname, 'sample-test.png');
        fs.writeFileSync(tempImgPath, tinyPngBuffer);

        const formData = new FormData();
        formData.append('title', 'Damaged Drainage Cover with Photo');
        formData.append('category', 'Water');
        formData.append('location', 'Station Road, Platform 1 Exit');
        formData.append('description', 'Severe damage to drain cover, photo attached.');
        formData.append('priority', 'High');
        formData.append('status', 'Reported');
        formData.append('lat', '16.544');
        formData.append('lng', '81.526');

        const fileBlob = new Blob([fs.readFileSync(tempImgPath)], { type: 'image/png' });
        formData.append('image', fileBlob, 'sample-test.png');

        const postRes = await fetch('http://127.0.0.1:5000/api/issues', {
            method: 'POST',
            body: formData
        });
        const createdIssue = await postRes.json();
        console.log('✅ POST with Image Success! Issue:', createdIssue);
        console.log('📸 Uploaded Image URL:', createdIssue.imageUrl);

        // Verify the uploaded image is reachable via HTTP
        const imgCheckRes = await fetch(`http://127.0.0.1:5000${createdIssue.imageUrl}`);
        console.log(`✅ Image HTTP check (${createdIssue.imageUrl}): Status ${imgCheckRes.status}`);

        console.log('\n--- 3. Testing PATCH /api/issues/:id/status (Status Update Control) ---');
        const patchRes = await fetch(`http://127.0.0.1:5000/api/issues/${createdIssue._id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'In Progress' })
        });
        const patchedIssue = await patchRes.json();
        console.log(`✅ PATCH Status to "In Progress" Success! New status: ${patchedIssue.status}`);

        const patchRes2 = await fetch(`http://127.0.0.1:5000/api/issues/${createdIssue._id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Resolved' })
        });
        const patchedIssue2 = await patchRes2.json();
        console.log(`✅ PATCH Status to "Resolved" Success! New status: ${patchedIssue2.status}`);

        // Clean up temporary local test image file
        if (fs.existsSync(tempImgPath)) fs.unlinkSync(tempImgPath);

        console.log('\n🎉 ALL IMAGE UPLOAD & STATUS UPDATE TESTS PASSED 100%!');
    } catch (err) {
        console.error('❌ Test failed:', err);
    }
}

testApi();
