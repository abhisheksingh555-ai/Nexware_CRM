const Order = require("../models/Order");
const {
  createOrderSchema,
  updateOrderSchema,
} = require("../validations/order.validation");

// CREATE ORDER
exports.createOrder = async (req, res) => {
  try {
    const { error, value } = createOrderSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        errors: error.details.map((d) => d.message),
      });
    }

    // Set totalAmount
    value.totalAmount = value.quantity * value.priceAtOrderTime;

    // Payment logic
    if (value.paymentMode !== "Partial Payment") {
      value.depositedAmount = 0;
      value.remainingAmount = 0;
      value.paymentStatus = value.paymentMode === "COD" ? "Pending" : "Paid";
    } else {
      value.remainingAmount = value.totalAmount - (value.depositedAmount || 0);
      value.paymentStatus = value.remainingAmount === 0 ? "Paid" : "Pending";
    }

    const order = new Order(value);
    const savedOrder = await order.save();

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: savedOrder,
    });
  } catch (err) {
    console.error("CREATE ORDER ERROR →", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET ALL ORDERS
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("productId", "productName price")
      .populate("agentId", "name email")
      .sort({ createdAt: -1 });

    const orderList = orders.map((o) => ({
      id: o._id,
      customerName: o.customerName,
      phone: o.phone,
      orderStatus: o.orderStatus,
      paymentStatus: o.paymentStatus,
      paymentMode: o.paymentMode,
      totalAmount: o.totalAmount || o.quantity * o.priceAtOrderTime,
      createdAt: o.createdAt,
    }));

    res.status(200).json({ success: true, data: orderList });
  } catch (error) {
    console.error("GET ORDERS ERROR →", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET ORDER BY ID
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.query;

    const order = await Order.findById(orderId)
      .populate("productId", "productName price")
      .populate("agentId", "name email");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const totalAmount = order.totalAmount || order.quantity * order.priceAtOrderTime;

    res.status(200).json({ success: true, data: { ...order.toObject(), totalAmount } });
  } catch (error) {
    console.error("GET ORDER ERROR →", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// UPDATE ORDER
exports.updateOrder = async (req, res) => {
  try {
    const { error, value } = updateOrderSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        errors: error.details.map((e) => e.message),
      });
    }

    const { id, quantity, priceAtOrderTime, ...updateData } = value;
    const existingOrder = await Order.findById(id);

    if (!existingOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (["Delivered", "Cancelled", "Returned"].includes(existingOrder.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot update a ${existingOrder.orderStatus} order`,
      });
    }

    const finalQuantity = quantity ?? existingOrder.quantity;
    const finalPrice = priceAtOrderTime ?? existingOrder.priceAtOrderTime;

    if (finalQuantity <= 0 || finalPrice < 0) {
      return res.status(400).json({ success: false, message: "Invalid quantity or price" });
    }

    updateData.quantity = finalQuantity;
    updateData.priceAtOrderTime = finalPrice;
    updateData.totalAmount = finalQuantity * finalPrice;

    const paymentMode = updateData.paymentMode || existingOrder.paymentMode;

    if (paymentMode !== "Partial Payment") {
      updateData.paymentMode = paymentMode;
      updateData.depositedAmount = 0;
      updateData.remainingAmount = 0;
      updateData.paymentStatus = paymentMode === "COD" ? "Pending" : "Paid";
    } else {
      const deposited = updateData.depositedAmount ?? existingOrder.depositedAmount ?? 0;
      if (deposited < 0) return res.status(400).json({ success: false, message: "Deposited amount cannot be negative" });
      if (deposited > updateData.totalAmount) return res.status(400).json({ success: false, message: "Deposited amount cannot exceed total amount" });

      const remaining = updateData.remainingAmount ?? updateData.totalAmount - deposited;
      if (remaining < 0) return res.status(400).json({ success: false, message: "Remaining amount cannot be negative" });

      updateData.paymentMode = "Partial Payment";
      updateData.depositedAmount = deposited;
      updateData.remainingAmount = remaining;
      updateData.paymentStatus = remaining === 0 ? "Paid" : "Pending";
    }

    if (updateData.orderStatus === "Delivered") {
      updateData.paymentStatus = "Paid";
      updateData.remainingAmount = 0;
    }

    const updatedOrder = await Order.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate("productId", "productName price")
      .populate("agentId", "name email");

    res.status(200).json({ success: true, message: "Order updated successfully", data: updatedOrder });
  } catch (err) {
    console.error("UPDATE ORDER ERROR →", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE ORDER
exports.deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const deletedOrder = await Order.findByIdAndDelete(orderId);

    if (!deletedOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(200).json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    console.error("DELETE ORDER ERROR →", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
