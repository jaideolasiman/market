const Notification = require("../../models/notification");

module.exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .populate("user", "firstName lastName role") // Fetch user's name and role
      .sort({ createdAt: -1 }) // Show latest notifications first
      .limit(10); // Limit the number of notifications

    res.json({ success: true, notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, error: "Error fetching notifications" });
  }
};
