// firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, addDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyALmu7TdY_Xaq8BXVlmwkhLwBCyL84QLIo",   // ウェブ API キー
  authDomain: "sample-firebase-ai-app-44ce8.firebaseapp.com",  // authDomainは「プロジェクトID.firebaseapp.com」という形式になります
  projectId: "sample-firebase-ai-app-44ce8",   // プロジェクト ID
  storageBucket: "sample-firebase-ai-app-44ce8.appspot.com",  // storageBucketは「プロジェクトID.appspot.com」という形式になります
  messagingSenderId: "758556239321",   // プロジェクト番号
  appId: "1:758556239321:web:df80139013e0b05da465c8"  // appIdは、アプリ追加後にFirebaseコンソールの「Firebase SDKの設定」画面で表示されます

};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth, collection, doc, setDoc, getDoc, updateDoc, addDoc };


