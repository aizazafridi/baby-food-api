// middlewares/auth.js

const jwt = require('jsonwebtoken');

// Middleware to verify token only
function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, 'secretkey', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Middleware to verify token AND check for specific roles
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, 'secretkey', (err, user) => {
      if (err) return res.sendStatus(403);
      if (!allowedRoles.includes(user.role)) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };
}

module.exports = {
  authenticateToken,
  authorizeRoles,
};
