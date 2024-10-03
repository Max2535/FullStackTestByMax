const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

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

// เพิ่มผู้เล่นใหม่
app.post('/api/players', (req, res) => {
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
app.post('/api/players/:id/score', (req, res) => {
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

// แสดงคะแนนของผู้เล่นทั้งหมด (Leaderboard)
app.get('/api/leaderboard', (req, res) => {
  const sql = 'SELECT id, username, score FROM players ORDER BY score DESC LIMIT 10';
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({ players: rows });
  });
});

// แสดงคะแนนของผู้เล่นคนเดียว
app.get('/api/players/:id', (req, res) => {
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
app.delete('/api/players/:id', (req, res) => {
  const playerId = req.params.id;

  const sql = 'DELETE FROM players WHERE id = ?';
  db.run(sql, [playerId], function (err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({ message: 'Player deleted successfully' });
  });
});

// เริ่มเซิร์ฟเวอร์
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
