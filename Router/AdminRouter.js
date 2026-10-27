const express = require("express");
const router = express.Router();

const {
  createAdminData,
  getAdminData,
  getAdminDataById,
  updateAdminData,
  deleteAdminData,
} = require("../controllers/AdminController");


router.use((req, res, next) => {
  if (req.session?.user?.role !== "admin") {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  next();
});


router.post("/", createAdminData);


router.get("/", getAdminData);


router.get("/:id", getAdminDataById);


router.put("/:id", updateAdminData);


router.delete("/:id", deleteAdminData);

module.exports = router;



















// const express = require("express");

// const router = express.Router();

// const {
//   createAdminData,
//   getAdminData,
//   getAdminDataById,
//   updateAdminData,
//   deleteAdminData,
// } = require("../controllers/AdminController");

// // Check admin authentication
// router.use((req, res, next) => {
//   if (req.session?.user?.role !== "admin") {
//     return res.status(401).json({
//       success: false,
//       message: "Authentication required.",
//     });
//   }

//   next();
// });

// // Save new club data
// router.post("/", createAdminData);

// // Fetch all club data
// router.get("/", getAdminData);

// // Fetch a particular record
// router.get("/:id", getAdminDataById);

// // Update a record
// router.put("/:id", updateAdminData);

// // Delete a record
// router.delete("/:id", deleteAdminData);

// module.exports = router;
