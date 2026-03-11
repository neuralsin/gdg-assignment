function requireRole(...roles) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated." });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "You do not have permission to do this." });
    }
    next();
  };
}
module.exports = requireRole;
