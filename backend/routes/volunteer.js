const express = require("express");
const router = express.Router();
const { createVolunteer, getMyProfile, getMyMissions, completeMission } = require("../controllers/volunteerController");
const { protect: auth } = require("../middleware/auth");

// Create or update volunteer profile
// Note: Frontend likely calls /create. Controller handles create/update.
const upload = require("../config/upload");

router.post("/create", auth, createVolunteer);

// Get my profile
router.get("/me", auth, getMyProfile);

// Get my assigned missions
router.get("/my-missions", auth, getMyMissions);

// Complete a mission
router.post("/missions/:missionId/complete", auth, completeMission);

// Reject a mission
router.post("/missions/:missionId/reject", auth, require("../controllers/volunteerController").rejectTask);

// Upload field evidence (returns URLs to be sent in complete or update routes)
router.post("/upload-evidence", auth, upload.array("evidence", 5), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "No files uploaded" });
        }
        const processUrls = req.files.map(file => `uploads/evidence/${file.filename}`);
        res.json({ success: true, urls: processUrls });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ message: "File upload failed" });
    }
});

// Get assigned tasks
router.get("/tasks", auth, require("../controllers/volunteerController").getMyTasks);

// Update task status
router.put("/tasks/:id", auth, require("../controllers/volunteerController").updateTaskStatus);

// Get dashboard stats
router.get("/stats", auth, require("../controllers/volunteerController").getDashboardStats);

// Admin: Auto-assign volunteers
router.post("/admin/auto-assign", auth, require("../controllers/volunteerController").autoAssignVolunteers);

// Admin/Coordinator: Get Recommendations
router.get("/recommendations", auth, require("../controllers/volunteerController").getTaskRecommendations);

// Toggle Availability
router.patch("/availability", auth, require("../controllers/volunteerController").toggleAvailability);

module.exports = router;
