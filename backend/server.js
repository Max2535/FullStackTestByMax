const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const { OAuth2Client } = require("google-auth-library");
const verifyToken = require("./middleware/authMiddleware"); // นำเข้า middleware
require("dotenv").config(); // นำเข้า dotenv

const app = express();
// การตั้งค่าให้อนุญาตทุกแหล่งที่มา
app.use(cors());
const port = 3001;
// ตั้งค่า Google OAuth2Client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// ใช้ body-parser เพื่อ parse request body
app.use(bodyParser.json());

// เชื่อมต่อกับฐานข้อมูล SQLite
const db = new sqlite3.Database("./game_scores.db", (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log("Connected to the SQLite database.");
  }
});

// สร้างตารางสำหรับเก็บข้อมูลผู้เล่นและคะแนน หากยังไม่มีตาราง
db.run(`
CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user VARCHAR(255) NOT NULL,
    username TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    date DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

function updateScoreAndStreak(result, score, streak) {
  if (result === 'win') {
    score += 1;
    streak += 1;
    if (streak === 3) {
      score += 1; // ให้คะแนนพิเศษเมื่อชนะ 3 ครั้งติดต่อกัน
      streak = 0; // รีเซ็ต streak
    }
  } else if (result === 'lose') {
    score = Math.max(0, score - 1); // ป้องกันคะแนนติดลบ
    streak = 0; // รีเซ็ต streak เมื่อแพ้
  }
  return { score, streak };
}

app.post("/api/players", verifyToken, async (req, res) => {
  const { result, token } = req.body;
  try {
    // ตรวจสอบ token ที่ได้รับจาก Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const playerId = payload["sub"]; // รหัสประจำตัวของผู้ใช้ Google    
    const name = payload["name"]; // ชื่อของผู้ใช้   

    db.get("SELECT score, streak FROM players WHERE user = ?", [playerId], (err, player) => {
      if (err || !player) {
        let score = 0;
        let streak = 0;

        ({ score, streak } = updateScoreAndStreak(result, score, streak));

        const insertSql = "INSERT INTO players (user,username, score, streak, date) VALUES (?,?, ?, ?, ?)";
        db.run(insertSql, [playerId,name,score,streak,Date.now()], function (err) {
          if (err) {
            return res.status(400).json({ error: err.message });
          }
          res.json({ playerId: this.lastID, playerId });
        });
      }else{
        let { score, streak } = player;
  
        ({ score, streak } = updateScoreAndStreak(result, score, streak));
  
        const sql = 'UPDATE players SET score = ?, streak = ? WHERE user = ?';
        db.run(sql, [score, streak, playerId], function (err) {
          if (err) {
            return res.status(400).json({ error: err.message });
          }
          res.json({ score, streak });
        });
      }
    });
  } catch (error) {
    console.error("Error verifying Google token:", error);
    res.status(401).json({ message: "Invalid token" });
  }
});

// แสดงคะแนนของผู้เล่นทั้งหมด (Leaderboard)
app.get("/api/leaderboard", verifyToken, (req, res) => {
  const sql =
  "SELECT user,username, score, streak, date FROM players ORDER BY score DESC LIMIT 10";
db.all(sql, [], (err, rows) => {
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  res.json({ players: rows });
});
});

// แสดงคะแนนของผู้เล่นคนเดียว
app.get("/api/players/", verifyToken, async (req, res) => {
  try {
    
    db.get("SELECT user, username, score, streak FROM players WHERE user = ?", [req.user.id], (err, player) =>{
      if (err || !player) {
        return res.status(404).json({ error: "Player not found" });
      }
      res.json(player);
    });
  } catch (error) {
    console.error("Error verifying Google token:", error);
    res.status(401).json({ message: "Invalid token" });
  }
});

// Endpoint สำหรับรับ Google token
app.post("/api/auth/google", async (req, res) => {
  const { token } = req.body;

  try {
    // ตรวจสอบ token ที่ได้รับจาก Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const userId = payload["sub"]; // รหัสประจำตัวของผู้ใช้ Google
    const email = payload["email"]; // อีเมลของผู้ใช้

    // ส่งข้อมูลผู้ใช้กลับไป
    res.json({
      message: "User authenticated successfully",
      user: {
        id: userId,
        email: email,
        name: payload["name"],
        picture: payload["picture"],
      },
    });
  } catch (error) {
    console.error("Error verifying Google token:", error);
    res.status(401).json({ message: "Invalid token" });
  }
});


app.get("/", async (req, res) => {
  res.status(200).json({ message: "Hello World!!!" });
});

// เริ่มเซิร์ฟเวอร์
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
