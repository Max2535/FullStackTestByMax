const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
require('dotenv').config(); // นำเข้า dotenv

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication token is required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    // เก็บข้อมูลผู้ใช้ใน req.user
    req.user = {
      id: payload['sub'],
      email: payload['email'],
      name: payload['name'],
      picture: payload['picture'],
    };

    next(); // ส่งต่อไปยัง route ถัดไป
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = verifyToken;
