const Report = require("../model/report");
const crypto = require("crypto");


const ACTIVATION_RATE = 84.746;
const MANPOWER_RATE = 1186.45;


function generateRefNo() {
  return crypto.randomBytes(12).toString("hex");
}


function roundMoney(amount) {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}


function getNumber(data, ...keys) {
  for (const key of keys) {
    if (
      data[key] !== undefined &&
      data[key] !== null &&
      data[key] !== ""
    ) {
      return Number(data[key]);
    }
  }

  return 0;
}


function calculateReport(data) {
  const topups = getNumber(data, "topUps", "topups");
  const sales = getNumber(data, "sales");
  const card = getNumber(data, "card");
  const cash = getNumber(data, "cash");
  const upi = getNumber(data, "upi");

  // Activation quantity
  const activations = getNumber(
    data,
    "activations",
    "activationCount"
  );

  // Manpower quantity
  const manPower = getNumber(
    data,
    "manPower",
    "manpowerCount",
    "manpower"
  );

  // Fixed rates
  const activationRate = ACTIVATION_RATE;
  const manpowerRate = MANPOWER_RATE;

  // Calculate activation and manpower amounts
  const activationAmount = roundMoney(
    activations * activationRate
  );

  const manpowerAmount = roundMoney(
    manPower * manpowerRate
  );

  // Existing report calculations
  const breakage = topups + sales - activationAmount;
  const licenceFee = topups * 0.011;
  const paymentsTotal = card + cash + upi;

  const subTotal =
    licenceFee + activationAmount + manpowerAmount;

  const gst = subTotal * 0.18;
  const invoiceTotal = subTotal + gst;
  const payable = paymentsTotal - invoiceTotal;

  return {
    topups,
    sales,
    card,
    cash,
    upi,

    // Quantities
    activations,
    manPower,

    // Fixed rates
    activationRate,
    manpowerRate,

    // Calculated amounts
    activationAmount,
    manpowerAmount,

    // Calculated totals
    breakage: roundMoney(breakage),
    licenceFee: roundMoney(licenceFee),
    paymentsTotal: roundMoney(paymentsTotal),
    subTotal: roundMoney(subTotal),
    gst: roundMoney(gst),
    invoiceTotal: roundMoney(invoiceTotal),
    payable: roundMoney(payable),
  };
}


function validateReport(data) {
  if (
    typeof data.clubName !== "string" ||
    !data.clubName.trim() ||
    typeof data.eventId !== "string" ||
    !data.eventId.trim()
  ) {
    return "Club name and event ID are required.";
  }

  const startDate = new Date(data.eventDate);
  const endDate = new Date(data.eventEndDate);

  if (
    !data.eventDate ||
    Number.isNaN(startDate.getTime())
  ) {
    return "A valid event start date is required.";
  }

  if (
    !data.eventEndDate ||
    Number.isNaN(endDate.getTime())
  ) {
    return "A valid event end date is required.";
  }

  if (endDate < startDate) {
    return "Event end date cannot be before the event start date.";
  }

  const numericFields = [
    "topups",
    "sales",
    "devices",
    "days",
    "card",
    "cash",
    "upi",
    "activations",
    "manPower",
  ];

  for (const field of numericFields) {
    if (
      !Number.isFinite(data[field]) ||
      data[field] < 0
    ) {
      return `${field} must be a valid non-negative number.`;
    }
  }

  if (!Number.isInteger(data.devices)) {
    return "Devices must be a whole number.";
  }

  if (!Number.isInteger(data.days) || data.days < 1) {
    return "Days must be a whole number greater than zero.";
  }

  return null;
}


function isValidReportId(id) {
  return (
    typeof id === "string" &&
    /^[a-f\d]{24}$/i.test(id)
  );
}


const createAdminData = async (req, res) => {
  try {
    const body = req.body || {};

    const reportData = {
      clubName:
        typeof body.clubName === "string"
          ? body.clubName.trim()
          : "",

      eventId:
        typeof body.eventId === "string"
          ? body.eventId.trim()
          : "",

      eventDate: body.eventStartDate ?? body.eventDate,
      eventEndDate: body.eventEndDate,

      devices: getNumber(body, "devices"),
      days: getNumber(body, "days"),

      ...calculateReport(body),
    };

    
    const validationError = validateReport(reportData);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    
    reportData.refNo = generateRefNo();

    
    const report = await Report.create(reportData);

    return res.status(201).json({
      success: true,
      message: "Club report saved successfully.",
      data: report,
    });
  } catch (error) {
    console.error("Create report error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Duplicate reference number. Please try creating the report again.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to save the club report.",
    });
  }
};


const getAdminData = async (req, res) => {
  try {
    const reports = await Report.find().sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    console.error("Get reports error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch club reports.",
    });
  }
};


const getAdminDataById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidReportId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report ID.",
      });
    }

    const report = await Report.findById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("Get report by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch the report.",
    });
  }
};


const updateAdminData = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidReportId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report ID.",
      });
    }

    const existingReport = await Report.findById(id);

    if (!existingReport) {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
      });
    }

    const body = req.body || {};

    const mergedData = {
      clubName: body.clubName ?? existingReport.clubName,

      eventId: body.eventId ?? existingReport.eventId,

      eventDate:
        body.eventStartDate ??
        body.eventDate ??
        existingReport.eventDate,

      eventEndDate:
        body.eventEndDate ?? existingReport.eventEndDate,

      topups:
        body.topUps ??
        body.topups ??
        existingReport.topups,

      sales: body.sales ?? existingReport.sales,

      devices: body.devices ?? existingReport.devices,

      days: body.days ?? existingReport.days,

      card: body.card ?? existingReport.card,

      cash: body.cash ?? existingReport.cash,

      upi: body.upi ?? existingReport.upi,

      activations:
        body.activations ??
        body.activationCount ??
        existingReport.activations,

      manPower:
        body.manPower ??
        body.manpowerCount ??
        body.manpower ??
        existingReport.manPower,
    };

    mergedData.clubName = String(mergedData.clubName).trim();
    mergedData.eventId = String(mergedData.eventId).trim();

    const updatedData = {
      clubName: mergedData.clubName,
      eventId: mergedData.eventId,
      eventDate: mergedData.eventDate,
      eventEndDate: mergedData.eventEndDate,

      devices: Number(mergedData.devices),
      days: Number(mergedData.days),

      ...calculateReport(mergedData),
    };

    const validationError = validateReport(updatedData);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    // Do not change refNo when updating an existing report
    const updatedReport = await Report.findByIdAndUpdate(
      id,
      updatedData,
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Report updated and recalculated successfully.",
      data: updatedReport,
    });
  } catch (error) {
    console.error("Update report error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update the report.",
    });
  }
};


const deleteAdminData = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidReportId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report ID.",
      });
    }

    const report = await Report.findByIdAndDelete(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Report deleted successfully.",
    });
  } catch (error) {
    console.error("Delete report error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete the report.",
    });
  }
};


module.exports = {
  createAdminData,
  getAdminData,
  getAdminDataById,
  updateAdminData,
  deleteAdminData,
};