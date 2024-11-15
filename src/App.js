//App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import MyPage from './pages/MyPage';

function App() {
  const userId = localStorage.getItem('userId');

  return (
    <Router>
      <div>
        <Routes>
          {/* ログインしていない場合、ログインページにリダイレクト */}
          <Route path="/" element={userId ? <Navigate to={`/profile/${userId}`} /> : <Navigate to="/login" />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/mypage/:userId" element={<MyPage />} />
          <Route path="/login/:userId" element={<ProfilePage />} />
          {/* <Route path="/profile/:userId" element={<ProfilePage />} /> */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
