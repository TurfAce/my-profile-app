//App.js

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import MyPage from './pages/MyPage';
// import TimerPage from './TimerPage';
// import FireAuth from './pages/FireAuth'
import { authState$ } from './firebase'; // Firebase の Observable をインポート

function App() {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const subscription = authState$.subscribe((uid) => {
      setUserId(uid);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Router>
      <div>
        <Routes>
          {/* ログインしていない場合、ログインページにリダイレクト */}
          <Route path="/" element={userId ? <Navigate to={`/profile/${userId}`} /> : <Navigate to="/login" />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          {/* <Route path="/fireauth" element={<FireAuth />} /> */}
          <Route path="/mypage/:userId" element={<MyPage />} />
          <Route path="/login/:userId" element={<ProfilePage />} />
          {/* <Route path="/timer" element={<TimerPage/>} /> */}
          {/* <Route path="/profile/:userId" element={<ProfilePage />} /> */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
