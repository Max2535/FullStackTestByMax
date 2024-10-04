// routes/apiRoutes.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware'); // นำเข้า middleware

// ทุก route ที่อยู่ในไฟล์นี้จะผ่าน middleware verifyToken ก่อน
router.use(verifyToken);

// ตัวอย่าง route ที่ต้องการตรวจสอบ token ก่อนใช้งาน
router.get('/leaderboard', (req, res) => {
  // ดึงข้อมูล leaderboard จากฐานข้อมูล
  res.json({ message: 'Leaderboard data', user: req.user });
});

router.post('/players/:id/score', (req, res) => {
  const playerId = req.params.id;
  const { result } = req.body;

  // Logic สำหรับการอัปเดตคะแนนในฐานข้อมูล
  res.json({ message: 'Score updated', playerId, result });
});

module.exports = router;
