// import React, { useEffect } from 'react';
// import firebase from 'firebase/compat/app';
// import 'firebase/compat/auth';
// import * as firebaseui from 'firebaseui';
// import 'firebaseui/dist/firebaseui.css';
// import { useNavigate } from 'react-router-dom';

// function LoginPage() {
//   const navigate = useNavigate();

//   useEffect(() => {
//     // FirebaseUI Config
//     const uiConfig = {
//       callbacks: {
//         signInSuccessWithAuthResult: (authResult) => {
//           // サインイン成功時にリダイレクト
//           const userId = authResult.user.uid;
//           localStorage.setItem('userId', userId);
//           navigate(`/mypage/${userId}`);
//           return false; // ページリロードを防ぐ
//         },
//         uiShown: () => {
//           // ローダーを隠す処理をここで記述可能
//           console.log('FirebaseUI widget displayed.');
//         },
//       },
//       signInFlow: 'popup', // ポップアップフローを使用
//       signInOptions: [
//         firebase.auth.GoogleAuthProvider.PROVIDER_ID,
//         firebase.auth.EmailAuthProvider.PROVIDER_ID,
//         firebase.auth.PhoneAuthProvider.PROVIDER_ID,
//       ],
//       tosUrl: '/terms', // 利用規約ページ
//       privacyPolicyUrl: '/privacy', // プライバシーポリシーページ
//     };

//     // FirebaseUIの初期化
//     const ui = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(firebase.auth());
//     ui.start('#firebaseui-auth-container', uiConfig);

//     // クリーンアップ
//     return () => {
//       ui.reset();
//     };
//   }, [navigate]);

//   return (
//     <div className="login-container">
//       <h1>ログイン</h1>
//       <div id="firebaseui-auth-container"></div>
//     </div>
//   );
// }

// export default LoginPage;
