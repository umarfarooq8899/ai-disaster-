const axios = require('axios');

async function verify() {
    try {
        const token = process.argv[2];
        if (!token) {
            console.error("Token required as argument");
            process.exit(1);
        }

        const res = await axios.get("http://localhost:5000/api/disasters/admin/all", {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log(`Fetched ${res.data.length} disasters`);

        const assigned = res.data.filter(d => d.assignedRescueOrgs.length > 0 || d.assignedNgoOrgs.length > 0);
        console.log(`Disasters with assignments: ${assigned.length}`);

        if (assigned.length > 0) {
            console.log("Sample assignment data:");
            assigned.slice(0, 3).forEach(d => {
                console.log(`- ${d.title}: Rescue [${d.assignedRescueOrgs.join(', ')}], NGO [${d.assignedNgoOrgs.join(', ')}]`);
            });
        }

        // Basic structure check
        const sample = res.data[0];
        if (sample && (sample.assignedRescueOrgs === undefined || sample.assignedNgoOrgs === undefined)) {
            console.error("Verification FAILED: New fields missing from response");
            process.exit(1);
        }

        console.log("Verification SUCCESS: Backend returns expected assignment data");
    } catch (err) {
        console.error("Verification failed with error:", err.message);
        process.exit(1);
    }
}

verify();
