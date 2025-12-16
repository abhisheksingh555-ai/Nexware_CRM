const User = require("../models/User");
const bcrypt = require("bcryptjs");
const {
  createUserValidation,
  updateUserValidation,
} = require("../validations/userValidation");

///////////////////// CREATE USER /////////////////////
exports.createUser = async (req, res) => {
  try {
    const { error } = createUserValidation(req.body);
    if (error)
      return res
        .status(400)
        .json({ message: error.details.map((e) => e.message).join(", ") });

    const payload = {
      ...req.body,
      email: req.body.email.toLowerCase().trim(),
      name: req.body.name.trim(),
      phone: req.body.phone ? req.body.phone.trim() : null,
    };

    const allowedRoles = ["admin", "subadmin", "teamhead", "agent"];
    if (!allowedRoles.includes(payload.role))
      return res.status(400).json({ message: "Invalid role" });

    const existing = await User.findOne({ email: payload.email });
    if (existing)
      return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(payload.password, 10);
    const user = await User.create({
      name: payload.name,
      email: payload.email,
      password: hashed,
      role: payload.role,
      phone: payload.phone || null,
      teamHeadId: payload.role === "agent" ? payload.teamHeadId : null,
      status: payload.status || "active",
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        teamHeadId: user.teamHeadId || null,
        status: user.status,
      },
    });
  } catch (err) {
    console.error("CREATE USER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

///////////////////// GET USERS /////////////////////
exports.getUsers = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    let users;
    if (user.role === "agent") {
      return res.status(403).json({ message: "Agents cannot view user list" });
    }
    if (user.role === "teamhead") {
      users = await User.find({ teamHeadId: user._id })
        .select("-password")
        .populate("teamHeadId", "name email");
    } else if (user.role === "subadmin") {
      users = await User.find({ role: { $ne: "admin" } })
        .select("-password")
        .populate("teamHeadId", "name email");
    } else {
      users = await User.find()
        .select("-password")
        .populate("teamHeadId", "name email");
    }
    res.json(users);
  } catch (error) {
    console.error("GET USERS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};


///////////////////// GET MY DETAILS /////////////////////
exports.getMyDetails = async (req, res) => {
  try {
    let query = User.findById(req.user._id).select("-password");
    query = query.populate({
      path: "teamHeadId",
      select: "name email phone role"
    });
    const user = await query;
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    let responseData = user.toObject();
    if (user.role === "agent" && user.teamHeadId) {
      responseData.teamHead = {
        _id: user.teamHeadId._id,
        name: user.teamHeadId.name,
        email: user.teamHeadId.email,
        phone: user.teamHeadId.phone,
      };
      delete responseData.teamHeadId;
    }
    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error("GET MY DETAILS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};


///////////////////// ADMIN UPDATE ANY USER /////////////////////
exports.anyUserUpdate = async (req, res) => {
  try {
    const { userId, updates } = req.body;
    const loggedIn = req.user;
    if (!loggedIn)
      return res.status(401).json({ message: "Unauthorized" });
    if (loggedIn.role !== "admin") {
      return res.status(403).json({ message: "Only admin can update any user" });
    }
    ["email", "lastLogin", "createdAt", "updatedAt"].forEach((field) => {
      if (updates[field]) delete updates[field];
    });
    if (updates.status === "inactive") {
      const targetUser = await User.findById(userId);
      if (targetUser && targetUser.role === "admin") {
        const activeAdmins = await User.countDocuments({
          role: "admin",
          status: "active",
        });
        if (activeAdmins <= 1) {
          return res.status(400).json({ message: "Cannot deactivate the last active admin" });
        }
      }
    }
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }
    if (updates.name) updates.name = updates.name.trim();
    if (updates.phone) updates.phone = updates.phone.trim();
    Object.keys(updates).forEach(key => {
      if (updates[key] === "" || updates[key] === null) {
        delete updates[key];
      }
    });
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true }
    ).select("-password");
    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });
    return res.json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("ANY USER UPDATE ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};


///////////////////// UPDATE OWN PROFILE /////////////////////
exports.updateUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const updates = { ...req.body };

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Allowed fields
    const allowedFields = ["name", "email", "phone"];

    // Remove any fields not allowed
    Object.keys(updates).forEach((key) => {
      if (!allowedFields.includes(key)) delete updates[key];
    });

    // If no valid fields provided
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "You can only update: name, email, phone",
      });
    }

    // Clean data
    if (updates.name) updates.name = updates.name.trim();
    if (updates.email) updates.email = updates.email.trim().toLowerCase();
    if (updates.phone) updates.phone = updates.phone.trim();

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });

  } catch (error) {
    console.error("UPDATE USER ERROR →", error);  // 🔥 VERY IMPORTANT
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



///////////////////// UPDATE STATUS /////////////////////
exports.updateStatus = async (req, res) => {
  try {
    const admin = req.user;
    const { userId, status } = req.body;

    if (!admin || admin.role !== "admin")
      return res.status(403).json({ message: "Only admin can update status" });

    if (!["active", "inactive"].includes(status))
      return res.status(400).json({ message: "Invalid status value" });

    const userToChange = await User.findById(userId);
    if (!userToChange) return res.status(404).json({ message: "User not found" });

    if (userToChange.role === "admin" && status === "inactive") {
      const adminCount = await User.countDocuments({ role: "admin", status: "active" });
      if (adminCount <= 1)
        return res.status(400).json({ message: "Cannot deactivate the last active admin" });
    }

    const user = await User.findByIdAndUpdate(userId, { status }, { new: true }).select("-password");
    res.json({ message: `User is now ${status}`, user });
  } catch (err) {
    console.error("UPDATE STATUS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

///////////////////// DELETE USER /////////////////////
exports.deleteUser = async (req, res) => {
  try {
    const admin = req.user;
    const { id } = req.body; 

    if (!admin || admin.role !== "admin")
      return res.status(403).json({ message: "Only admin can delete users" });

    const userToDelete = await User.findById(id);
    if (!userToDelete) return res.status(404).json({ message: "User not found" });

    if (userToDelete.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin", status: "active" });
      if (adminCount <= 1)
        return res.status(400).json({ message: "Cannot delete the last remaining active admin" });
    }

    await User.findByIdAndDelete(id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("DELETE USER ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};


///////////////////// ADMIN CHANGE ANY USER PASSWORD /////////////////////
exports.changePasswordAlluser = async (req, res) => {
  try {
    const admin = req.user;
    const { id, newPassword } = req.body;

    // Only admin can change password for any user
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can change user passwords",
      });
    }

    if (!id || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "User ID and new password are required",
      });
    }

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Save new password
    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password updated successfully",
    });

  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

///////////////////// GET ALL USERS (ANY AUTH USER) /////////////////////
exports.getAllUsers = async (req, res) => {
  try {
    const loggedIn = req.user;

    if (!loggedIn) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const users = await User.find()
      .select("-password")
      .populate("teamHeadId", "name email");

    res.json({
      success: true,
      count: users.length,
      data: users,
    });

  } catch (error) {
    console.error("GET USERS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};
