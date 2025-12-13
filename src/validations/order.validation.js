const Joi = require("joi");

const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);

const createOrderSchema = Joi.object({
  customerName: Joi.string().trim().required(),
  address: Joi.string().trim().required(),

  pincode: Joi.string()
    .pattern(/^\d{6}$/)
    .required(),

  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required(),

  productId: objectId.required(),
  agentId: objectId.required(),

  quantity: Joi.number().min(1).default(1),
  priceAtOrderTime: Joi.number().min(0).required(),

  paymentMode: Joi.string()
    .valid("COD", "Partial Payment", "Full Payment")
    .required(),

  depositedAmount: Joi.when("paymentMode", {
    is: "Partial Payment",
    then: Joi.number().min(0).required(),
    otherwise: Joi.number().default(0),
  }),

  remainingAmount: Joi.when("paymentMode", {
    is: "Partial Payment",
    then: Joi.number().min(0).required(),
    otherwise: Joi.number().default(0),
  }),

  orderStatus: Joi.string().valid(
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
    "Cancelled"
  ),

  paymentStatus: Joi.string().valid(
    "Pending",
    "Paid",
    "Failed",
    "Refunded"
  ),

  awb: Joi.string().allow(null, ""),
  remarks: Joi.string().allow(null, ""),
});

const updateOrderSchema = Joi.object({
  id: objectId.required(),

  customerName: Joi.string().trim(),
  address: Joi.string().trim(),
  pincode: Joi.string().pattern(/^\d{6}$/),
  phone: Joi.string().pattern(/^[6-9]\d{9}$/),

  productId: objectId,
  agentId: objectId,

  quantity: Joi.number().min(1),
  priceAtOrderTime: Joi.number().min(0),

  paymentMode: Joi.string().valid("COD", "Partial Payment", "Full Payment"),
  depositedAmount: Joi.number().min(0).allow(null),
  remainingAmount: Joi.number().min(0).allow(null),

  orderStatus: Joi.string().valid(
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
    "Cancelled"
  ),

  paymentStatus: Joi.string().valid(
    "Pending",
    "Paid",
    "Failed",
    "Refunded"
  ),

  awb: Joi.string().allow(null, ""),
  remarks: Joi.string().allow(null, ""),
}).min(1);

module.exports = {
  createOrderSchema,
  updateOrderSchema,
};
