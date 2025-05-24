const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authenticate  = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    let userId;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      // ✅ Ưu tiên xác thực bằng JWT
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id || decoded.userId;

      if (!userId) {
        return res.status(401).json({ message: "Token không hợp lệ" });
      }
    } else {
      // 🧾 Nếu không có token, lấy userId từ request
      userId = req.params.id || req.body.userId || req.query.userId;

      if (!userId) {
        return res.status(400).json({ message: "Thiếu ID người dùng" });
      }
    }

    // 🔍 Tìm người dùng trong database
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    // ✅ Gắn user vào request và tiếp tục
    req.user = user;
    next();

  } catch (error) {
    console.error("Lỗi xác thực:", error);
    return res.status(401).json({ message: "Xác thực thất bại" });
  }
};

module.exports = authenticate ;