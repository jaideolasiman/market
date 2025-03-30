const User = require('../../models/user');
const bcrypt = require('bcrypt');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/img/profile/'); // Ensure this directory exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_')); // Unique filenames
  }
});
const upload = multer({ storage: storage }).single('image');

module.exports.getUserInfo = async (req, res) => {
  console.log("Session Data:", req.session); // Debugging

  if (!req.session.login) { 
    return res.status(401).json({ message: "User not logged in" });
  }

  try {
    const user = await User.findById(req.session.login);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      profilePicture: user.profilePicture,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports.updateUserInfo = async (req, res) => {
  try {
    if (!req.session.login) {
      req.flash("error", "User not logged in");
      return res.redirect("/login");
    }

    upload(req, res, async function (err) {
      if (err) {
        console.error("File upload error:", err);
        req.flash("error", "File upload failed.");
        return res.redirect("back"); // Redirect back to the same page
      }

      const user = await User.findById(req.session.login);
      if (!user) {
        req.flash("error", "User not found");
        return res.redirect("back");
      }

      const { firstName, lastName, phoneNumber, currentPassword, newPassword } = req.body;

      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (phoneNumber) user.phoneNumber = phoneNumber;

      // Handle Profile Picture Update
      if (req.file) {
        if (user.profilePicture && user.profilePicture !== "/public/img/profile/default.png") {
          const oldImagePath = path.join(__dirname, "../../", user.profilePicture);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        user.profilePicture = `/public/img/profile/${req.file.filename}`;
      }

      // Handle Password Update (Optional)
      if (currentPassword && newPassword) {
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          req.flash("error", "Current password is incorrect.");
          return res.redirect("back");
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
      }

      await user.save();

      req.flash("success", "Profile updated successfully!");

      // ✅ Redirect based on user role
      if (user.role === "buyer") {
        return res.redirect("/buyer/index");
      } else if (user.role === "farmer") {
        return res.redirect("/farmer/index");
      } else if (user.role === "admin") {
        return res.redirect("/admin/index");
      } else {
        return res.redirect("/"); // Default redirect
      }

    });
  } catch (error) {
    console.error("Update Error:", error);
    req.flash("error", "Something went wrong. Please try again.");
    return res.redirect("back");
  }
};


