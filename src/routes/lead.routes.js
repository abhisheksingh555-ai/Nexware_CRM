const express = require("express");
const router = express.Router();
const leadController = require("../controllers/lead.controller");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware"); 
const validate = require("../middleware/validate.middleware");
const { createLeadSchema, updateLeadSchema } = require("../validations/lead.validation");
const uploadExcel = require("../middleware/uploadExcel");

// Create lead (Admin, SubAdmin, TeamHead, Agent)
router.post(
  "/", 
  auth, 
  role(["admin", "subadmin", "teamhead", "agent"]),
  validate(createLeadSchema), 
  leadController.createLead
);

// Upload leads via Excel (Admin, SubAdmin, TeamHead)
router.post(
  "/upload-leads-excel",
  auth,
  role(["admin"]),
  uploadExcel,
  leadController.uploadLeadsFromExcel
);


// Get all leads (all roles)
router.get(
  "/leads-list", 
  auth, 
  role(["admin", "subadmin", "teamhead", "agent"]),
  leadController.getLeads
);

// Get lead details (id via query)
router.get(
  "/lead-details", 
  auth, 
  role(["admin", "subadmin", "teamhead", "agent"]),
  leadController.getLeadById
);

// Update lead (status/remarks, Admin/SubAdmin/Agent)
router.put(
  "/updateLead", 
  auth, 
  role(["admin", "subadmin", "teamhead", "agent"]), 
  // validate(updateLeadSchema), 
  leadController.updateLead
);

// Delete lead (Admin only)
router.delete(
  "/deleteLead", 
  auth, 
  role(["admin"]), 
  leadController.deleteLead
);

module.exports = router;
