// import React, { useState } from 'react';
// import { useHistory } from 'react-router-dom';


// // ユーザーがログインしたら、そのユーザーのIDを取得してリダイレクト
// const handleLogin = async (email, password) => {
//   const response = await fetch('http://localhost:5000/login', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({ email, password }),
//   });

//   if (response.ok) {
//     const data = await response.json();
//     history.push(`/login/${data.userId}`); // /login/:userId にリダイレクト
//   } else {
//     // エラーハンドリング
//     console.error('Login failed');
//   }
// };

// const LoginPage = () => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const response = await fetch('http://localhost:5000/login', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ email, password }),
//     });

//     if (response.ok) {
//       const data = await response.json();
//       alert(data.message); // ログイン成功のメッセージ
//     } else {
//       const errorData = await response.json();
//       alert(errorData.message); // エラーメッセージ
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit}>
//       <input 
//         type="email" 
//         value={email} 
//         onChange={(e) => setEmail(e.target.value)} 
//         placeholder="Email" 
//         required 
//       />
//       <input 
//         type="password" 
//         value={password} 
//         onChange={(e) => setPassword(e.target.value)} 
//         placeholder="Password" 
//         required 
//       />
//       <button type="submit">Login</button>
//     </form>
//   );
// };

// export default LoginPage;


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
