// controllers/settings.controller.js
const User = require('../models/User');
const validator = require('validator');

const isCloudinaryUrl = (url) =>
  typeof url === 'string' &&
  /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/.+/i.test(url);

exports.updateSettings = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const {
      name,
      email,
      phone,
      avatarUrl,  // optional Cloudinary URL or null to remove
      language,
      timezone,
    } = req.body || {};

    const updatedFields = {};

    if (typeof name === 'string' && name.trim()) {
      updatedFields.name = name.trim();
    }

    if (typeof email === 'string' && email.trim()) {
      const trimmed = email.trim();
      if (!validator.isEmail(trimmed)) {
        return res.status(400).json({ error: 'Invalid email address.' });
      }
      // ensure email not used by someone else
      const exists = await User.findOne({ email: trimmed, _id: { $ne: userId } }).lean();
      if (exists) return res.status(409).json({ error: 'Email already in use.' });
      updatedFields.email = trimmed;
    }

    if (typeof phone === 'string') {
      updatedFields.phone = phone.trim();
    }

    // avatarUrl can be a valid Cloudinary URL, or null/empty to remove
    if ('avatarUrl' in (req.body || {})) {
      if (avatarUrl === null || avatarUrl === '' || avatarUrl === undefined) {
        updatedFields.avatarUrl = null;
      } else if (isCloudinaryUrl(avatarUrl)) {
        updatedFields.avatarUrl = avatarUrl;
      } else {
        return res.status(400).json({ error: 'avatarUrl must be a Cloudinary image URL or null.' });
      }
    }

    if (typeof language === 'string') updatedFields.language = language;
    if (typeof timezone === 'string') updatedFields.timezone = timezone;

    if (Object.keys(updatedFields).length === 0) {
      return res.status(400).json({ error: 'No fields to update.' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updatedFields },
      { new: true, runValidators: true, context: 'query' }
    ).select('-password -__v');

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.status(200).json({
      message: 'Settings updated successfully',
      user: updatedUser,
    });
  } catch (err) {
    console.error('❌ Error updating settings:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
