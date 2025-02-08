// RegisterPage.js

import React, { useState } from 'react';
import './registerpage.css';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from './firebase'; // Firebaseのインポートを適切なパスに変更
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      console.log('User registered with Firebase:', userCredential.user);

      await setDoc(doc(db, "users", userCredential.user.uid), {
        username: formData.username,
        email: formData.email,
        uid: userCredential.user.uid
      });

      localStorage.setItem('userId', userCredential.user.uid);
      localStorage.setItem('isNewUser', 'true');
      navigate(`/login/${userCredential.user.uid}`);
      console.log("User data saved to Firestore");
    } catch (error) {
      console.log('Error during registration:', error);
    }
  };

  const handleGoogleSignUp = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Firestoreにユーザー情報を保存
      await setDoc(doc(db, "users", user.uid), {
        username: user.displayName,
        email: user.email,
        uid: user.uid
      });

      localStorage.setItem('userId', user.uid);
      localStorage.setItem('isNewUser', 'true');
      navigate(`/login/${user.uid}`);
      console.log("User data saved to Firestore");
    } catch (error) {
      console.log('Error during Google sign-up:', error);
    }
  };

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleSubmit}>
        <h2>Register</h2>
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <button type="submit">Register</button>
      </form>
      <div className="google-signup-container">
        <p>Googleアカウントでアカウントを作る方はこちら:</p>
        <button className="google-signup-button" onClick={handleGoogleSignUp}>Sign up with Google</button>
      </div>
    </div>
  );
};

export default RegisterPage;