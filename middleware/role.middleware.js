export const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Convert to array if string
      if (!Array.isArray(allowedRoles)) {
        allowedRoles = [allowedRoles];
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          message: `Access denied. Allowed roles: ${allowedRoles.join(", ")}`,
          success: false
        });
      }

      next();

    } catch (error) {
      return res.status(500).json({
        message: "Role middleware error",
        success: false
      });
    }
  };
};
