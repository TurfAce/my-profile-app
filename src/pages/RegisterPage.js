// RegisterPage.js

import React, { useState } from 'react';
import './registerpage.css';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase'; // Firebaseのインポートを適切なパスに変更
import { doc, setDoc } from "firebase/firestore";
import { db } from './firebase';


const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

    const handleChange = (e) => {
      const { name, value} = e.target;
      setFormData({ ...formData, [name]: value });
    }

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   try {
  //     // Firebase Authでユーザーを登録
  //     const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
  //     console.log('User registered with Firebase:', userCredential.user);

  //     // ユーザー情報をサーバーに送信
  //     const response = await fetch('http://localhost:5000/register', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json'
  //       },
  //       body: JSON.stringify({
  //         username: formData.username,
  //         email: formData.email,
  //         uid: userCredential.user.uid // FirebaseのUIDをサーバーに送信
  //       })
  //     });

  //     if (response.ok) {
  //       const data = await response.json();
  //       console.log(data.message); // サーバーからのレスポンスを表示
  //     } else {
  //       console.error('Registration failed on server');
  //     }
  //   } catch (error) {
  //     console.error('Error during registration:', error);
  //   }
  // };

  const handlesubmit = async (e) => {
    e.preventDefault();
    try{
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      console.log('User registered with Firebase:', userCredential.user);

      await setDoc(doc(db, "users", userCredential.user.uid),{
        username: formData.username,
        email: formData.email,
        uid: userCredential.user.uid
      });

      console.log("User data saved to Firestore");
    }catch (error){
      console.log('Error during regstration:', error);
    }
  };

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handlesubmit}>
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
    </div>
  );
};

export default RegisterPage;
