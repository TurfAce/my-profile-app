import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';
import './SignupPage.css'; // 必要ならスタイルファイルを作成してください

function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      // 新規登録
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // 登録成功後、自動的にログイン
      localStorage.setItem('userId', userCredential.user.uid);
      navigate(`/mypage/${userCredential.user.uid}`);
    } catch (error) {
      console.error('Signup error:', error);
      alert('登録に失敗しました。もう一度お試しください。');
    }
  };

  return (
    <div className='signup-container'>
      <form className='signup-form' onSubmit={handleSignup}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <button type="submit">登録</button>
      </form>
    </div>
  );
}

export default SignupPage;
