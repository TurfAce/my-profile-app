// firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, addDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { BehaviorSubject } from 'rxjs';
import { onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyALmu7TdY_Xaq8BXVlmwkhLwBCyL84QLIo",
  authDomain: "sample-firebase-ai-app-44ce8.firebaseapp.com",
  projectId: "sample-firebase-ai-app-44ce8",
  storageBucket: "sample-firebase-ai-app-44ce8.appspot.com",
  messagingSenderId: "758556239321",
  appId: "1:758556239321:web:df80139013e0b05da465c8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const storage = getStorage(app);

export { provider, db, auth, collection, doc, setDoc, getDoc, updateDoc, addDoc, arrayUnion, arrayRemove };
export const authState$ = new BehaviorSubject(null);

onAuthStateChanged(auth, (user) => {
  authState$.next(user ? user.uid : null);
});

// リクエスト送信
export const sendExchangeRequest = async (currentUserId, targetUserId) => {
  try {
    const targetUserDocRef = doc(db, 'users', targetUserId);

    await updateDoc(targetUserDocRef, {
      exchangeRequests: arrayUnion({
        from: currentUserId,
        status: 'pending',
      }),
    });

    return { success: true, message: '交換リクエストを送信しました' };
  } catch (error) {
    console.error('交換リクエスト送信中にエラーが発生しました', error);
    return { success: false, message: 'リクエスト送信中にエラーが発生しました' };
  }
};

// リクエスト承認
export const approveExchangeRequest = async (currentUserId, fromUserId) => {
  try {
    const currentUserDocRef = doc(db, 'users', currentUserId);
    const fromUserDocRef = doc(db, 'users', fromUserId);

    // 自分のリクエストステータスを更新
    await updateDoc(currentUserDocRef, {
      exchangeRequests: arrayUnion({ from: fromUserId, status: 'approved' }),
    });

    // 双方の connections を更新
    await updateDoc(currentUserDocRef, {
      connections: arrayUnion(fromUserId),
    });

    await updateDoc(fromUserDocRef, {
      connections: arrayUnion(currentUserId),
    });

    return { success: true, message: 'リクエストを承認しました' };
  } catch (error) {
    console.error('リクエスト承認中にエラーが発生しました', error);
    return { success: false, message: '承認中にエラーが発生しました' };
  }
};