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
    updateAidStatus
} = require("../controllers/ngoController");

router.use(protect);
router.use(ngoOnly);

router.get("/stats", getDashboardStats);
router.get("/resources", getResources);
router.post("/resources", upsertResource);
router.get("/assignments", getAidAssignments);
router.get("/volunteers", require("../controllers/volunteerController").getOrgVolunteers);
router.post("/assignments", createAidAssignment);
router.patch("/assignments/:id/status", updateAidStatus);

module.exports = router;
