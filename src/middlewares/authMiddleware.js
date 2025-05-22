const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Không có token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // decoded.id hoặc decoded.userId phụ thuộc payload khi tạo token
    const userId = decoded.id || decoded.userId;
    if (!userId) return res.status(401).json({ message: "Token không hợp lệ" });

    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ message: "Người dùng không tồn tại" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token không hợp lệ" });
  }
};

module.exports = authMiddleware;
