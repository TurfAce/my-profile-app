//LoginPage.js



import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    fetch('http://localhost:5000/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.userId) {
        // ログイン成功時にユーザーIDを含めたURLにリダイレクト
        navigate(`/login/${data.userId}`);
      } else {
        alert('ログインに失敗しました');
      }
    })
    .catch(error => {
      console.error('Login error:', error);
    });
  };

  return (
    <form onSubmit={handleLogin}>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
      <button type="submit">ログイン</button>
    </form>
  );
}

export default LoginPage;
