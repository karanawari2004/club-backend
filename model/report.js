const mongoose = require("mongoose");
const crypto = require("crypto");

const reportSchema = new mongoose.Schema(
{
clubName: {
type: String,
required: true,
trim: true,
},


eventDate: {
  type: Date,
  required: true,
},

eventEndDate: {
  type: Date,
  required: true,
},

eventId: {
  type: String,
  required: true,
  trim: true,
},

refNo: {
  type: String,
  required: true,
  unique: true,
  default: () => crypto.randomBytes(12).toString("hex"),
  trim: true,
  immutable: true,
},

topups: {
  type: Number,
  required: true,
  min: 0,
},

sales: {
  type: Number,
  required: true,
  min: 0,
},

devices: {
  type: Number,
  required: true,
  min: 0,
},

days: {
  type: Number,
  required: true,
  min: 1,
},

card: {
  type: Number,
  required: true,
  min: 0,
},

cash: {
  type: Number,
  required: true,
  min: 0,
},

upi: {
  type: Number,
  required: true,
  min: 0,
},

activations: {
  type: Number,
  required: true,
  min: 0,
},

activationRate: {
  type: Number,
  default: 84.746,
  immutable: true,
},

activationAmount: {
  type: Number,
  required: true,
  min: 0,
},

manPower: {
  type: Number,
  required: true,
  min: 0,
},

manpowerRate: {
  type: Number,
  default: 1186.45,
  immutable: true,
},

manpowerAmount: {
  type: Number,
  required: true,
  min: 0,
},

breakage: {
  type: Number,
  required: true,
},

licenceFee: {
  type: Number,
  required: true,
  min: 0,
},

paymentsTotal: {
  type: Number,
  required: true,
  min: 0,
},

subTotal: {
  type: Number,
  required: true,
  min: 0,
},

gst: {
  type: Number,
  required: true,
  min: 0,
},

invoiceTotal: {
  type: Number,
  required: true,
  min: 0,
},

payable: {
  type: Number,
  required: true,
},


},
{
timestamps: true,
}
);

// Export Report model
module.exports = mongoose.model("Report", reportSchema);
