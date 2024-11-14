// index.js
const express = require('express');
const cors = require('cors');
const { db } = require('./firebase');
const { auth } = require('./firebase');
const { signInWithEmailAndPassword } = require('firebase/auth');
const { collection, doc, setDoc, getDoc, updateDoc } = require('firebase/firestore');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json()); // JSON形式のリクエストを処理する

// ユーザー登録エンドポイント
app.post('/register', async (req, res) => {
    const { username, email, uid } = req.body;
    try { 
      await setDoc(doc(db, 'users', uid),{
        username,
        email,
        bio: 'This user has not set up a bio yet.',
        profile_picture_url: 'https://example.com/',
        social_links: {},
      });
    res.status(200).json({ message: 'User registered and profile created' });
    } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
    }
  });


  
  //"ログインエンドポイント"    
  app.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
  
        // Firestoreからユーザーデータを取得
        const userDoc = doc(db, 'users', user.uid);
        const userData = await getDoc(userDoc);
  
        if (!userData.exists()) {
            return res.status(404).json({ message: 'User not found in Firestore' });
        }
  
        res.status(200).json({
            message: 'Login successful',
            userId: user.uid,
            user: userData.data()
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(401).json({ message: 'Invalid email or password', error: error.message });
    }
  });
  

// プロフィール作成・更新エンドポイント
app.post('/login', async (req, res) => {
  const { user_id, bio, profile_picture_url, social_links } = req.body;

  try {
      // FirestoreのusersコレクションでユーザーIDに基づいてドキュメントを作成・更新
      const userDoc = doc(db, 'profiles', user_id); // profilesコレクションのuser_idをドキュメントIDに指定
      await setDoc(userDoc, {
          bio,
          profile_picture_url,
          social_links,
      }, { merge: true }); // merge: true で既存データを保持しつつ更新

      res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});
  
// プロフィール取得エンドポイント
app.get('/login/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
      // Firestoreからユーザー情報を取得
      const userDoc = doc(db, 'users', userId);
      const userData = await getDoc(userDoc);

      if (!userData.exists()) {
          return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json(userData.data());
  } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Profile update endpoint
app.put('/login/:userId', async (req, res) => {
  const { userId } = req.params;
  const { bio, profile_picture_url, social_links } = req.body;
  try {
    await updateDoc(doc(db, 'users', userId), {
      bio,
      profile_picture_url,
      social_links,
    });
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
