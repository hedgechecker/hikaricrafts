const jwt = require("jsonwebtoken");
const JWT_SECRET = "your-secret-key";

function authRequired(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "No token" });

  const token = auth.split(" ")[1];

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function adminRequired(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "No token" });

  const token = auth.split(" ")[1];

  try {
    const user = jwt.verify(token, JWT_SECRET);

    if (user.role !== "ADMIN") {
      return res.status(403).json({ message: "Admin access only" });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function optionalAuth(req, res, next) {
  const auth = req.headers.authorization;

  if (!auth) {
    req.user = null;
    return next();
  }

  try {
    const token = auth.split(' ')[1];
    req.user = jwt.verify(token, JWT_SECRET);
  } catch {
    req.user = null;
  }

  next();
}

module.exports = {
  authRequired,
  adminRequired,
  optionalAuth,
};  
