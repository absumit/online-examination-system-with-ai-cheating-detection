
const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).send("User not authenticated.");
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).send("Access denied. Insufficient permissions.");
    }
    next();
  };
};

module.exports=authorizeRole;