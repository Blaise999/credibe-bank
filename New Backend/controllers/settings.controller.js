const User = require('../models/User');

exports.updateSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phone } = req.body;

    if (!name && !email && !phone) {
      return res.status(400).json({ error: "No fields to update." });
    }

    const updatedFields = {};
    if (name) updatedFields.name = name;
    if (email) updatedFields.email = email;
    if (phone) updatedFields.phone = phone;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updatedFields },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json({ message: "Settings updated successfully", user: updatedUser });
  } catch (err) {
    console.error("❌ Error updating settings:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};
