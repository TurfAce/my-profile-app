//LoginPage.js
import { useAuth } from '../AuthContext';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase'; 
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Loginpage.css';

const provider = new GoogleAuthProvider();
// provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
// provider.setCustomParameters({
//   'login_hint': 'user@example.com'
// });

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  // const { user1 } = useAuth();

  const startLogin = async(e) => {
    signInWithPopup(auth, provider)
      .then((result) => {
        // This gives you a Google Access Token. You can use it to access the Google API.
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;
        // The signed-in user info.
        const user = result.user;
        // IdP data available using getAdditionalUserInfo(result)
        // ...

        console.log(user);
        console.log("----");
        // console.log(user1);
        // console.log("----");
      }).catch((error) => {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        // The email of the user's account used.
        const email = error.customData.email;
        // The AuthCredential type that was used.
        const credential = GoogleAuthProvider.credentialFromError(error);
        // ...
      });
  }

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

      <input type="button" onClick={startLogin} value="Googleログイン" />
    </div>
  );
}

export default LoginPage;
