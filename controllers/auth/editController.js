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
      return res.status(401).json({ message: "User not logged in" });
    }

    upload(req, res, async function (err) {
      if (err) {
        console.error("File upload error:", err);
        return res.status(500).json({ message: "File upload error", error: err.message });
      }

      const user = await User.findById(req.session.login);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { firstName, lastName, phoneNumber, password, newPassword } = req.body;
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

      // Handle Password Update
      if (password && newPassword) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(400).json({ message: "Current password is incorrect" });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
      }

      await user.save();
      console.log("Updated User:", user);

      res.redirect("/buyer/index");
    });
  } catch (error) {
    console.error("Update Error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
