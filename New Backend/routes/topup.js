const express = require("express");
const router = express.Router();
const topUpController = require("../controllers/topup.controller");

router.post("/request", topUpController.requestTopUp);
router.post("/handle", topUpController.handleTopUp);
router.get("/pending", topUpController.getPendingTopUps);

module.exports = router;
