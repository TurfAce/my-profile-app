//LoginPage.js
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase'; 


import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Loginpage.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();


  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      localStorage.setItem('userId', userCredential.user.uid);   
      navigate(`/mypage/${userCredential.user.uid}`); // ここでリダイレクトを追加
    } catch(error) {
      console.error('Login error:', error);
    }
  };
  
  return (
    <div className='login-container'>
      <form className='login-form' onSubmit={handleLogin}>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        <button type="submit">ログイン</button>
      </form>
    </div>
  );
}

export default LoginPage;
