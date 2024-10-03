const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const { OAuth2Client } = require('google-auth-library');
const app = express();
const port = 3001;
const clientID ="219049469149-88g6l9orerd1ucthahjnj05pf1vjgebv.apps.googleusercontent.com"; 
// ตั้งค่า Google OAuth2Client
const client = new OAuth2Client(clientID);
// ใช้ body-parser เพื่อ parse request body
app.use(bodyParser.json());

// เชื่อมต่อกับฐานข้อมูล SQLite
const db = new sqlite3.Database('./game_scores.db', (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// สร้างตารางสำหรับเก็บข้อมูลผู้เล่นและคะแนน หากยังไม่มีตาราง
db.run(`
  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0
  )
`);
// Middleware สำหรับตรวจสอบ token
const verifyToken = async (req, res, next) => {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1]; // รับ token จาก header
  
    if (!token) {
      return res.status(401).json({ message: 'Token is required' });
    }
  
    try {
      // ตรวจสอบ token
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: clientID,
      });
      const payload = ticket.getPayload();
      
      // เก็บข้อมูลผู้ใช้ไว้ใน req.user สำหรับใช้ใน action ถัดไป
      req.user = {
        id: payload['sub'],
        email: payload['email'],
        name: payload['name'],
        picture: payload['picture']
      };
  
      // ไปยัง middleware หรือ route ถัดไป
      next();
    } catch (error) {
      console.error('Error verifying token:', error);
      return res.status(401).json({ message: 'Invalid token' });
    }
  };
// เพิ่มผู้เล่นใหม่
app.post('/api/players', verifyToken, (req, res) => {
  const { username } = req.body;

  const sql = 'INSERT INTO players (username) VALUES (?)';
  db.run(sql, [username], function (err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({ playerId: this.lastID, username });
  });
});

// อัปเดตคะแนนของผู้เล่น
app.post('/api/players/:id/score', verifyToken, (req, res) => {
  const playerId = req.params.id;
  const { result } = req.body; // result เป็น 'win' หรือ 'lose'

  db.get('SELECT score, streak FROM players WHERE id = ?', [playerId], (err, player) => {
    if (err || !player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    let { score, streak } = player;

    if (result === 'win') {
      score += 1;
      streak += 1;
      if (streak === 3) {
        score += 1; // ให้คะแนนพิเศษเมื่อชนะ 3 ครั้งติดต่อกัน
        streak = 0; // รีเซ็ต streak
      }
    } else if (result === 'lose') {
      score -= 1;
      streak = 0; // รีเซ็ต streak เมื่อแพ้
    }

    const sql = 'UPDATE players SET score = ?, streak = ? WHERE id = ?';
    db.run(sql, [score, streak, playerId], function (err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      res.json({ score, streak });
    });
  });
});

// เพิ่ม middleware สำหรับทุก action ที่ต้องการตรวจสอบ token
// แสดงคะแนนของผู้เล่นทั้งหมด (Leaderboard)
app.get('/api/leaderboard', verifyToken,(req, res) => {
  const sql = 'SELECT id, username, score FROM players ORDER BY score DESC LIMIT 10';
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({ players: rows });
  });
});

// แสดงคะแนนของผู้เล่นคนเดียว
app.get('/api/players/:id', verifyToken, (req, res) => {
  const playerId = req.params.id;

  const sql = 'SELECT id, username, score, streak FROM players WHERE id = ?';
  db.get(sql, [playerId], (err, player) => {
    if (err || !player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    res.json(player);
  });
});

// ลบผู้เล่น
app.delete('/api/players/:id', verifyToken, (req, res) => {
  const playerId = req.params.id;

  const sql = 'DELETE FROM players WHERE id = ?';
  db.run(sql, [playerId], function (err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({ message: 'Player deleted successfully' });
  });
});


// Endpoint สำหรับรับ Google token
app.post('/api/auth/google', verifyToken, async (req, res) => {
    const { token } = req.body;
  
    try {
      // ตรวจสอบ token ที่ได้รับจาก Google
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: 'YOUR_GOOGLE_CLIENT_ID',
      });
      const payload = ticket.getPayload();
      const userId = payload['sub']; // รหัสประจำตัวของผู้ใช้ Google
      const email = payload['email']; // อีเมลของผู้ใช้
  
      // ส่งข้อมูลผู้ใช้กลับไป
      res.json({
        message: 'User authenticated successfully',
        user: {
          id: userId,
          email: email,
          name: payload['name'],
          picture: payload['picture'],
        },
      });
    } catch (error) {
      console.error('Error verifying Google token:', error);
      res.status(401).json({ message: 'Invalid token' });
    }
  });


// เริ่มเซิร์ฟเวอร์
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
