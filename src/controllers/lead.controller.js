const Lead = require("../models/Lead");
const { createLeadSchema, updateLeadSchema } = require("../validations/lead.validation");

// Create Lead
exports.createLead = async (req, res) => {
  try {
    const { error } = createLeadSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const messages = error.details.map(d => d.message);
      return res.status(400).json({ success: false, errors: messages });
    }

    const { name, phone, service, address, assignedTo, status, remarks, source } = req.body;

    const lead = new Lead({
      name,
      phone,
      service,
      address,
      source: source || "",
      assignedTo: assignedTo || null,
      status: status || "Ring",
      remarks: remarks || "",
      createdBy: req.user._id,
    });

    const savedLead = await lead.save();
    res.status(201).json({ success: true, data: savedLead });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get all leads (with access control)
exports.getLeads = async (req, res) => {
  try {
    let query = {};

    // Admin can see all leads
    if (req.user.role !== 'admin') {
      // Non-admin can see leads where they are assigned or they created it
      query = {
        $or: [
          { assignedTo: req.user._id },
          { createdBy: req.user._id }
        ]
      };
    }

    const leads = await Lead.find(query)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    const dashboardLeads = leads.map(l => ({
      id: l._id,
      name: l.name,
      mobile: l.phone,
      status: l.status,
      date: l.createdAt,
    }));

    res.status(200).json({ success: true, data: dashboardLeads });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get lead by ID (with access control)
exports.getLeadById = async (req, res) => {
  try {
    let { leadId } = req.query;
    if (!leadId) return res.status(400).json({ success: false, message: "Lead ID required" });

    leadId = leadId.toString().trim().replace(/"/g, "");

    const lead = await Lead.findById(leadId)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });

    // Access control: only admin or assigned/creator can view
    if (req.user.role !== 'admin' && !(lead.assignedTo && lead.assignedTo._id.equals(req.user._id)) && !lead.createdBy._id.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const leadDetails = {
      name: lead.name,
      mobile: lead.phone,
      service: lead.service,
      address: lead.address,
      source: lead.source,
      status: lead.status,
      remarks: lead.remarks,
      assignedTo: lead.assignedTo,
      createdBy: lead.createdBy,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    };

    res.status(200).json({ success: true, data: leadDetails });
  } catch (error) {
    console.error("GET LEAD BY ID ERROR →", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Update Lead (no change, uses existing role control)
exports.updateLead = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, message: "Lead ID required" });

    const { error } = updateLeadSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const messages = error.details.map(d => d.message);
      return res.status(400).json({ success: false, errors: messages });
    }

    const { status, remarks, assignedTo, source, name, phone, service, address } = req.body;

    const updatedLead = await Lead.findByIdAndUpdate(
      id,
      { status, remarks, assignedTo, source, name, phone, service, address, updatedAt: Date.now() },
      { new: true }
    )
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    if (!updatedLead) return res.status(404).json({ success: false, message: "Lead not found" });

    res.status(200).json({ success: true, message: "Lead updated successfully", data: updatedLead });
  } catch (error) {
    console.error("Update Lead Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Delete Lead (Admin only, no change)
exports.deleteLead = async (req, res) => {
  try {
    const { leadId } = req.body;
    if (!leadId) return res.status(400).json({ success: false, message: "Lead ID required" });

    const deletedLead = await Lead.findByIdAndDelete(leadId);
    if (!deletedLead) return res.status(404).json({ success: false, message: "Lead not found" });

    res.status(200).json({ success: true, message: "Lead deleted successfully" });
  } catch (error) {
    console.error("Delete Lead Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
