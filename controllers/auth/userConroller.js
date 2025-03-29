const User = require('../../models/user')
const bcrypt = require("bcrypt");

module.exports.editProfile = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    res.render("editProfile", { user, messages: req.flash() });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).render("500");
  }
};

module.exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      req.flash("error", "User not found.");
      return res.redirect("/editProfile");
    }

    user.firstName = req.body.firstName || user.firstName;
    user.lastName = req.body.lastName || user.lastName;
    user.phoneNumber = req.body.phoneNumber || user.phoneNumber;

    // Only update profile picture if a new one is uploaded
    if (req.file) {
      user.profilePicture = `/public/img/profile/${req.file.filename}`;
    }

    await user.save();
    req.flash("success", "Profile updated successfully.");
    res.redirect("/editProfile");
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).render("500");
  }
};
