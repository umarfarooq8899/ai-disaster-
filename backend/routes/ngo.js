const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ngoOnly = require("../middleware/ngoOnly");
const {
    getDashboardStats,
    getResources,
    upsertResource,
    getAidAssignments,
    createAidAssignment,
    updateAidStatus,
    assignVolunteers,
    verifyAidAssignment,
    cancelAidAssignment
} = require("../controllers/ngoController");

router.use(protect);
router.use(ngoOnly);

router.get("/stats", getDashboardStats);
router.get("/activity", require("../controllers/ngoController").getRecentActivity);
router.get("/resources", getResources);
router.post("/resources", upsertResource);
router.get("/assignments", getAidAssignments);
router.get("/volunteers", require("../controllers/volunteerController").getOrgVolunteers);
router.post("/assignments", createAidAssignment);
router.delete("/assignments/:id", cancelAidAssignment);
router.patch("/assignments/:id/status", updateAidStatus);
router.patch("/assignments/:id/volunteers", assignVolunteers);
router.post("/assignments/:id/verify", verifyAidAssignment);
router.post("/updates", require("../controllers/ngoController").postStatusUpdate);
router.get("/assignment-history", require("../controllers/ngoController").getAidHistory);

module.exports = router;
