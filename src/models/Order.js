const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    pincode: {
      type: String,
      required: true,
      match: [/^\d{6}$/, "Invalid pincode"],
    },

    phone: {
      type: String,
      required: true,
      match: [/^[6-9]\d{9}$/, "Invalid phone number"],
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    quantity: {
      type: Number,
      min: 1,
      default: 1,
    },

    priceAtOrderTime: {
      type: Number,
      min: 0,
      required: true,
    },

    totalAmount: {
      type: Number,
      min: 0,
    },

    paymentMode: {
      type: String,
      enum: ["COD", "Partial Payment", "Full Payment"],
      required: true,
    },

    depositedAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    remainingAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    orderStatus: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Packed",
        "Shipped",
        "In Transit",
        "Out For Delivery",
        "Delivered",
        "RTO Initiated",
        "RTO Received",
        "Returned",
        "Cancelled",
      ],
      default: "Pending",
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },

    awb: {
      type: String,
      default: null,
    },

    remarks: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
