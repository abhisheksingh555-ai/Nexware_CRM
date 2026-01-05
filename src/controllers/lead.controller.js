const Lead = require("../models/Lead");
const XLSX = require("xlsx");
const { createLeadSchema, updateLeadSchema } = require("../validations/lead.validation");

// Create Lead (Non-admins can create, but won't see it afterwards unless assigned to them)
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

// Get all leads (RESTRICTED: Non-admin sees ONLY assigned leads)
exports.getLeads = async (req, res) => {
  try {
    let query = {};

    // Admin can see all leads
    if (req.user.role !== 'admin') {
      // Non-admin can ONLY see leads assigned to them.
      // Removed { createdBy: req.user._id } so creators cannot view their own leads unless assigned.
      query = { assignedTo: req.user._id };
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

// Get lead by ID (RESTRICTED)
exports.getLeadById = async (req, res) => {
  try {
    let { leadId } = req.query;
    if (!leadId) return res.status(400).json({ success: false, message: "Lead ID required" });

    leadId = leadId.toString().trim().replace(/"/g, "");

    const lead = await Lead.findById(leadId)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });

    // Access control:
    // Admin: Can view all.
    // Non-Admin: Can ONLY view if assignedTo matches their ID.
    const isAssignedToUser = lead.assignedTo && lead.assignedTo._id.equals(req.user._id);
    
    if (req.user.role !== 'admin' && !isAssignedToUser) {
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

// Update Lead (RESTRICTED FIELDS for Non-Admin)
exports.updateLead = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, message: "Lead ID required" });

    // 1. Fetch the existing lead first to check permissions
    const existingLead = await Lead.findById(id);
    if (!existingLead) return res.status(404).json({ success: false, message: "Lead not found" });

    // 2. Check Permission to Update
    const isAssignedToUser = existingLead.assignedTo && existingLead.assignedTo.toString() === req.user._id.toString();
    
    if (req.user.role !== 'admin' && !isAssignedToUser) {
        return res.status(403).json({ success: false, message: "You are not authorized to update this lead." });
    }

    // 3. Prepare Update Data based on Role
    let updateData = {};

    if (req.user.role === 'admin') {
        // Admin can update ALL fields
        // Validate full schema if necessary, or manually map
        const { error } = updateLeadSchema.validate(req.body, { abortEarly: false });
        if (error) {
             const messages = error.details.map(d => d.message);
             return res.status(400).json({ success: false, errors: messages });
        }
        
        const { status, remarks, assignedTo, source, name, phone, service, address } = req.body;
        updateData = { status, remarks, assignedTo, source, name, phone, service, address };

    } else {
        // Non-Admin can ONLY update status and remarks
        // We explicitly ignore other fields sent in req.body
        const { status, remarks } = req.body;
        
        // Basic validation for these two fields if needed
        if(!status && !remarks) {
             return res.status(400).json({ success: false, message: "Nothing to update." });
        }

        if (status) updateData.status = status;
        if (remarks) updateData.remarks = remarks;
    }

    // Add updated timestamp
    updateData.updatedAt = Date.now();

    const updatedLead = await Lead.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    res.status(200).json({ success: true, message: "Lead updated successfully", data: updatedLead });
  } catch (error) {
    console.error("Update Lead Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Delete Lead (Admin only)
exports.deleteLead = async (req, res) => {
  try {
    const { leadId } = req.body;
    if (!leadId) return res.status(400).json({ success: false, message: "Lead ID required" });

    // Ensure only admin can delete (Double check controller level permission)
    if(req.user.role !== 'admin'){
        return res.status(403).json({ success: false, message: "Access denied. Admin only." });
    }

    const deletedLead = await Lead.findByIdAndDelete(leadId);
    if (!deletedLead) return res.status(404).json({ success: false, message: "Lead not found" });

    res.status(200).json({ success: true, message: "Lead deleted successfully" });
  } catch (error) {
    console.error("Delete Lead Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};



// Upload leads from Excel
exports.uploadLeadsFromExcel = async (req, res) => {
  try {
    // 1. Check file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Excel file is required",
      });
    }

    // 2. Read Excel from BUFFER (IMPORTANT)
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheetData = XLSX.utils.sheet_to_json(
      workbook.Sheets[sheetName],
      { defval: "" } // prevents undefined values
    );

    if (!sheetData.length) {
      return res.status(400).json({
        success: false,
        message: "Excel file is empty",
      });
    }

    let successCount = 0;
    let failedCount = 0;
    const errors = [];
    const leadsToInsert = [];

    // 3. Validate rows
    for (let i = 0; i < sheetData.length; i++) {
      const row = sheetData[i];

      if (!row.name || !row.phone || !row.service) {
        failedCount++;
        errors.push({
          row: i + 2,
          error: "name, phone and service are required",
        });
        continue;
      }

      leadsToInsert.push({
        name: row.name,
        phone: row.phone.toString().trim(),
        service: row.service,
        address: row.address || "",
        source: row.source || "Excel",
        status: row.status || "Ring",
        remarks: row.remarks || "",
        createdBy: req.user._id,
      });
    }

    // 4. Remove duplicate phones (DB level)
    const phones = leadsToInsert.map(l => l.phone);
    const existingLeads = await Lead.find({ phone: { $in: phones } }).select("phone");

    const existingPhones = new Set(existingLeads.map(l => l.phone));

    const finalLeads = leadsToInsert.filter(l => {
      if (existingPhones.has(l.phone)) {
        failedCount++;
        errors.push({
          phone: l.phone,
          error: "Duplicate phone number",
        });
        return false;
      }
      return true;
    });

    // 5. Bulk insert (FAST & SAFE)
    if (finalLeads.length > 0) {
      await Lead.insertMany(finalLeads, { ordered: false });
      successCount = finalLeads.length;
    }

    // 6. Response
    return res.status(200).json({
      success: true,
      message: "Excel processed successfully",
      total: sheetData.length,
      inserted: successCount,
      failed: failedCount,
      errors,
    });

  } catch (error) {
    console.error("Excel Upload Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to upload Excel",
      error: error.message,
    });
  }
};

