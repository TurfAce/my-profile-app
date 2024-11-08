// index.js
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json()); // JSON形式のリクエストを処理する

// ユーザー登録エンドポイント
app.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    
    db.run(sql, [username, email, password], function(err) {
      if (err) {
        return res.status(500).json({ message: 'Internal server error', error: err.message });
      }
  
      const userId = this.lastID;
      
      // 初期プロフィールのテンプレート
      const defaultProfile = {
        bio: 'このユーザーはまだ自己紹介を設定していません。',
        profile_picture_url: 'https://example.com/default-profile.png',
        social_links: JSON.stringify({}),
      };
  
      // プロフィールをデータベースに追加
      const profileSql = 'INSERT INTO profiles (user_id, bio, profile_picture_url, social_links) VALUES (?, ?, ?, ?)';
      db.run(profileSql, [userId, defaultProfile.bio, defaultProfile.profile_picture_url, defaultProfile.social_links], function(err) {
        if (err) {
          return res.status(500).json({ message: 'Error creating profile', error: err.message });
        }
  
        // 登録成功時にユーザーIDを返す
        res.status(200).json({ message: 'User registered and profile created', userId: userId });
      });
    });
  });
      
// ログインエンドポイント
app.post('/login', (req, res) => {
    const { email, password } = req.body;
  
    const sqlSelectUser = 'SELECT * FROM users WHERE email = ? AND password = ?';
    db.get(sqlSelectUser, [email, password], (err, user) => {
      if (err) {
        return res.status(500).json({ message: 'Internal server error', error: err.message });
      }
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
  
      // ログイン成功: /login/:userId にリダイレクト
      res.status(200).json({ message: 'Login successful', userId: user.id });
    });
  });

    app.get('/profile/:userId', (req, res) => {
    const { userId } = req.params;
  
    const sql = 'SELECT username, email FROM users WHERE id = ?';
    db.get(sql, [userId], (err, row) => {
      if (err) {
        console.error(err.message);
        return res.status(500).send({ message: 'Internal server error', error: err.message });
      }
      if (!row) {
        return res.status(404).send({ message: 'User not found' });
      }
      res.status(200).send(row);
    });
  });
  
  // プロフィール作成・更新エンドポイント
app.post('/profile', (req, res) => {
    const { user_id, bio, profile_picture_url, social_links } = req.body;
    const sql = `
      INSERT INTO profiles (user_id, bio, profile_picture_url, social_links)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        bio = excluded.bio,
        profile_picture_url = excluded.profile_picture_url,
        social_links = excluded.social_links
    `;
  
    db.run(sql, [user_id, bio, profile_picture_url, social_links], function(err) {
      if (err) {
        return res.status(500).json({ message: 'Internal server error', error: err.message });
      }
      res.status(200).json({ message: 'Profile updated successfully' });
    });
  });
  
// プロフィール取得エンドポイント
app.get('/login/:userId', (req, res) => {
  const userId = req.params.userId;
  const sql = 'SELECT * FROM profiles WHERE user_id = ?';

  db.get(sql, [userId], (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Internal server error', error: err.message });
    }
    if (!row) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.status(200).json(row);
  });
});

// プロフィール更新エンドポイント
app.put('/login/:userId', (req, res) => {
  const userId = req.params.userId;
  const { bio, profile_picture_url, social_links } = req.body;

  db.run(
    `UPDATE profiles SET bio = ?, profile_picture_url = ?, social_links = ? WHERE user_id = ?`,
    [bio, profile_picture_url, social_links, userId],
    function (err) {
      if (err) {
        res.status(500).send({ error: 'Database error' });
      } else if (this.changes === 0) {
        res.status(404).send({ error: 'Profile not found' });
      } else {
        res.json({ message: 'Profile updated successfully' });
      }
    }
  );
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});