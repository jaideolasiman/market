const User = require("../../models/user");
const UserToken = require("../../models/userToken");
const multer = require("multer");
const fileUpload = require("../../middlewares/profile-upload-middleware.js");
const profileController = require("./profileController");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { customAlphabet } = require("nanoid");

const sixDigitCode = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 6);
const JWT_SECRET = process.env.JWT_SECRET;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const SITE_TITLE = "PAO";

module.exports.register = async (req, res) => {
  try {
    if (req.session.login) {
      return res.redirect(`/${user.role}/index`);
    }
    res.render("register", {
      site_title: SITE_TITLE,
      title: "Register",
      session: req.session,
      messages: req.flash(),
      currentUrl: req.originalUrl,
      userLogin: null,
      req: req,
      error: null,
    });
  } catch (error) {
    console.error("Error rendering register page:", error);
    return res.status(500).render("500");
  }
};

module.exports.doRegister = async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });
    const upload = multer({
      storage: fileUpload.files.storage(),
      allowedFile: fileUpload.files.allowedFile,
    }).single("image");

    upload(req, res, async function (err) {
      if (err) {
        console.error("File upload error:", err);
        return res.status(err.status || 500).render("500", { err });
      }
      
      const imageUrl = req.file ? `/public/img/profile/${req.file.filename}` : "";
      const { role, firstName, lastName, email, password, confirmPassword, phoneNumber, gender } = req.body;

      if (existingUser && existingUser.isVerified) {
        req.flash("message", "Email Already Used!");
        return res.redirect("/register");
      }

      if (password !== confirmPassword) {
        req.flash("message", "Password does not match.");
        return res.redirect("/register");
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({
        role, firstName, lastName, email,
        password: hashedPassword, phoneNumber,
        profilePicture: imageUrl, gender
      });
      await user.save();

      const registrationToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1d" });
      const verificationCode = sixDigitCode();
      await new UserToken({
        userId: user._id,
        token: registrationToken,
        verificationCode,
        expirationDate: new Date(Date.now() + 24 * 5 * 60 * 1000),
        expirationCodeDate: new Date(Date.now() + 5 * 60 * 1000),
      }).save();
      
      if (req.file) await profileController.post("/updateProfile")(req, res);
      
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: EMAIL_USER, pass: EMAIL_PASS },
      });
      
      const sendEmail = async (to, subject, htmlContent) => {
        try {
          await transporter.sendMail({ from: `PAO <${EMAIL_USER}>`, to, subject, html: htmlContent });
        } catch (error) {
          console.error("Error sending email:", error);
        }
      };
      
      const emailContent = `
        <div style="background-color: #e8f5e9; padding: 20px; width: 70%; text-align: justify; border-radius: 10px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #007bff;">Hello ${user.email},</h2>
          <p>Welcome aboard! Please verify your email to unlock all features.</p>
          <p>Your verification code is: <strong style="color: #007bff;">${verificationCode}</strong></p>
        </div>
      `;

      await sendEmail(user.email, "Verify your email", emailContent);
      req.flash("success", "Verification email sent. Please check your email.");
      return res.redirect(`/verify?token=${registrationToken}&sendcode=true`);
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).render("500");
  }
};
