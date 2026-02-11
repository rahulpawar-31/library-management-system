import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Authorization token required",
        success: false
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Token missing",
        success: false
      });
    }

    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);

    req.user = decoded;

    next();

  } catch (error) {

    
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token expired",
        success: false
      });
    }

    return res.status(401).json({
      message: "Invalid or expired token",
      success: false
    });
  }
};
