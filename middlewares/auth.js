const jwt = require('jsonwebtoken');
const AdminAuthenticate = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).send("Access denied, no token provided");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(400).send("Invalid token");
  }
};

const authenticate = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).send("Access denied, no token provided");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(400).send("Invalid token");
  }
};
module.exports = { authenticate, AdminAuthenticate };
