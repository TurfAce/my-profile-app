// LoginPage.js
import { onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../firebase'; 
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Loginpage.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

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

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      localStorage.setItem('userId', result.user.uid);
      navigate(`/mypage/${result.user.uid}`);
    } catch (error) {
      console.error('Google SignIn error:', error);
    }
  };

  
  return (
    <div className='login-container'>
      <form className='login-form' onSubmit={handleLogin}>
        <h2>Login</h2>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        <button type="submit">ログイン</button>
      </form>
      <div className="google-login-container">
        <p>Googleアカウントでログインする方はこちら:</p>
        <button className="google-login-button" onClick={handleGoogleSignIn}>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

export default LoginPage;