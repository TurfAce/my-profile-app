import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyPage.css';
import ProfileDetail from './ProfileDetail';  // ProfileDetailのインポート

import { QRCodeCanvas } from 'qrcode.react';
import { useAuth } from '../AuthContext';
import { db } from './firebase';
import { doc, getDoc, updateDoc, setDoc, arrayUnion, collection, getDocs } from 'firebase/firestore';


import { QrReader } from 'react-qr-scanner';


function MyPage() {
  const [exchangedProfiles, setExchangedProfiles] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sentRequests, setSentRequests] = useState([]);
  const [isQRCodeVisible, setIsQRCodeVisible] = useState(false); // QRコード表示状態
  const [isQRScannerVisible, setIsQRScannerVisible] = useState(false); // QRスキャナー表示状態
  const [receivedRequests, setReceivedRequests] = useState([]);
  const currentUserId = localStorage.getItem('userId');
  const { user } = useAuth();

  const navigate = useNavigate();
  useEffect(() => {
    // 交換済みプロフィールの取得
    const fetchExchangedProfiles = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUserId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const profiles = data.exchangedProfiles || [];
          setExchangedProfiles(profiles);
        } else {
          console.error('ユーザーが見つかりません');
        }
      } catch (error) {
        console.error('交換済みプロフィールの取得エラー:', error);
      }
    };

    // すべてのユーザーの取得（自分を除く）
    const fetchAllUsers = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const querySnapshot = await getDocs(usersCollection);
        const users = [];
        querySnapshot.forEach((doc) => {
          if (doc.id !== currentUserId) { // 自分自身を除外
            users.push({ id: doc.id, ...doc.data() });
          }
        });
        setAllUsers(users);
        setFilteredUsers([]); // 初期状態では全ユーザーを表示
      } catch (error) {
        console.error('全ユーザーの取得エラー:', error);
      }
    };

    const fetchRequests = async () => {
      try {
        const currentUserRef = doc(db, 'users', currentUserId);
        const currentUserDoc = await getDoc(currentUserRef);

        if (currentUserDoc.exists()) {
          const userData = currentUserDoc.data();
          setSentRequests(userData.sentRequests || []);
          setReceivedRequests(userData.receivedRequests || []);
        }
      } catch (error) {
        console.error('リクエストデータの取得エラー:', error);
      }
    };

    fetchExchangedProfiles();
    fetchAllUsers();
    fetchRequests();
  }, [currentUserId]);

  // 検索機能
  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);

    // 検索クエリが空ならばfilteredUsersを空配列にする
    if (query) {
      const filtered = allUsers.filter((user) =>
        user.username.toLowerCase().includes(query.toLowerCase())  // ユーザー名が一致する場合
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers([]);  // 検索が空の場合、表示はなし
    }
  };

  const handleEditProfile = () => {
    navigate(`/login/${currentUserId}`);
  }

  const jumpToAnProfile = (userId) => {
    navigate(`/login/${userId}`);
  }

  const sendRequest = async (targetUserId) => {
    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);
    
    try {
      // 現在のユーザーの sentRequests にリクエスト追加
      await updateDoc(currentUserRef, {
        sentRequests: arrayUnion({
          targetUserId: targetUserId,   // 正しく相手のIDを指定
          status: 'pending',
        }),
      });
  
      // 対象ユーザーの receivedRequests にリクエスト追加
      await updateDoc(targetUserRef, {
        receivedRequests: arrayUnion({
          fromUserId: currentUserId,    // 正しく自分のIDを指定
          status: 'pending',
        }),
      });
  
      alert('リクエストを送信しました');
    } catch (error) {
      console.error('リクエスト送信エラー:', error);
      alert('リクエスト送信に失敗しました。もう一度お試しください。');
    }
  };

  const handleQRScan = (userId) => {
    alert(`QR scan simasita: ${userId}`);
    setIsQRScannerVisible(false);
  }

  const handleQRScannerToggle = () => {
    setIsQRScannerVisible(!isQRScannerVisible);
    setIsQRCodeVisible(false);
  }

  const handleQRCodeToggle = () => { 
    setIsQRCodeVisible(!isQRCodeVisible);
    setIsQRScannerVisible(false);
  }

  const QRCodeGenerator = ({ userId }) => {
    const qrValue = `your-app://exchange/${userId}`; // QRコードのデータ

    return (
      <div className="qr-code-container">
        <h3>QRコードをスキャンしてプロフィールを交換</h3>
        <QRCodeCanvas value={qrValue} size={150} />
      </div>
    );
  };

  const QRCodeScanner = ({ onScan }) => {
    const [error, setError] = useState('');
  
    const handleScan = (data) => {
      if (data) {
        const userId = data.replace('your-app://exchange/', '');
        onScan(userId);
      }
    };
  
    const handleError = (err) => {
      console.error('QRコードスキャンエラー:', err);
      setError('QRコードをスキャンできませんでした。もう一度試してください。');
    };
  
    return (
      <div className="qr-scanner-container">
        <h3>QRコードをスキャンしてリクエスト送信</h3>
        <QrReader
          delay={300}
          onError={handleError}
          onResult={(result, error) => {
            if (result) handleScan(result.text);
          }}
          style={{ width: '100%' }}
        />
        {error && <p className="error-message">{error}</p>}
                {/* QRコード生成とスキャンセクション */}
                <div className="qr-code-section">
          <QRCodeGenerator userId={currentUserId} />
          <QRCodeScanner onScan={handleScan} />
        </div>

      </div>
    );

    
  };
  
  

        

  const approveRequest = async (fromUserId) => {
    const currentUserRef = doc(db, 'users', currentUserId);
    const fromUserRef = doc(db, 'users', fromUserId);
    
    try {
      // 現在のユーザーの receivedRequests を更新
      const currentUserDoc = await getDoc(currentUserRef);
      const currentUserData = currentUserDoc.data();
      const updatedReceivedRequests = currentUserData.receivedRequests.map((req) =>
        req.fromUserId === fromUserId ? { ...req, status: 'approved' } : req
      );
  
      await updateDoc(currentUserRef, {
        receivedRequests: updatedReceivedRequests,
        exchangedProfiles: arrayUnion(fromUserId), // 承認時に交換リストへ追加
      });
  
      // リクエスト送信元ユーザーの sentRequests を更新
      const fromUserDoc = await getDoc(fromUserRef);
      const fromUserData = fromUserDoc.data();
      const updatedSentRequests = fromUserData.sentRequests.map((req) =>
        req.targetUserId === currentUserId ? { ...req, status: 'approved' } : req
      );
  
      await updateDoc(fromUserRef, {
        sentRequests: updatedSentRequests,
        exchangedProfiles: arrayUnion(currentUserId), // 承認時に交換リストへ追加
      });
  
      alert('リクエストを承認しました');
    } catch (error) {
      console.error('リクエスト承認エラー:', error);
      alert('リクエスト承認に失敗しました。');
    }
  };
    
  const ProfileDetail = ({ userId }) => {
    const [profile, setProfile] = useState(null);
    const [canView, setCanView] = useState(false); // 閲覧権限
    const [note, setNote] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const currentUserId = localStorage.getItem('userId');
  
    useEffect(() => {
      const fetchData = async () => {
        try {
          const currentUserRef = doc(db, 'users', currentUserId);
          const currentUserDoc = await getDoc(currentUserRef);
          const exchangedProfiles = currentUserDoc.exists()
            ? currentUserDoc.data().exchangedProfiles || []
            : [];
          setCanView(exchangedProfiles.includes(userId));
    
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            setProfile(userDoc.data());
          }
    
          const noteRef = doc(db, 'users', currentUserId, 'privateNotes', userId);
          const noteDoc = await getDoc(noteRef);
          if (noteDoc.exists()) {
            setNote(noteDoc.data().note);
          }
        } catch (error) {
          console.error('データ取得エラー:', error);
        }
      };
    
      fetchData();
    }, [userId, currentUserId]);
    
    const saveNote = async () => {
      setIsSaving(true);
      const noteRef = doc(db, 'users', currentUserId, 'privateNotes', userId);
      try {
        await setDoc(
          noteRef,
          {
            note,
            updatedAt: new Date(),
          },
          { merge: true }
        );
        alert('メモが保存されました');
      } catch (error) {
        console.error('メモ保存エラー:', error);
        alert('メモの保存に失敗しました');
      } finally {
        setIsSaving(false);
      }
    };
      
    if (!canView) {
      return <p>このプロフィールを閲覧する権限がありません。</p>;
    }
  
    if (!profile) {
      return <p>プロフィールを読み込み中...</p>;
    }
  
    return (
      <div>
        <h3>{profile.username}</h3>
        <p>{profile.bio}</p>
        {/* 他のプロフィール情報 */}
        <h3>メモ</h3>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="ここにメモを入力してください"
        />
        <button onClick={saveNote} disabled={isSaving}>
          {isSaving ? '保存中...' : '保存する'}
        </button>
      </div>
    );
  };  



  
  // プロフィール交換処理
    return (
      <div className="mypage-container">
        {/* カード編集ボタン */}
        <div className="edit-button-container">
          <button className="edit-button" onClick={handleEditProfile}>カード編集</button>
        </div>

        <div className='qr-buttons'>
          <button onClick={handleQRCodeToggle}>
            {isQRCodeVisible ? 'Close QR' : 'Open QR'}
          </button>
          <button onClick={handleQRScannerToggle}>
            {isQRScannerVisible ? 'Close scanner' : 'Open scanner'}
          </button>
          {isQRCodeVisible && <QRCodeGenerator userId={currentUserId} />}
          {isQRScannerVisible && <QRCodeScanner />}
        </div>
    
        {/* アイコン表示 */}
        <div className="icon-display">
          <span className="icon-placeholder">マイページ</span>
        </div>
    
        {/* 検索ボックス */}
        <div className="search-box">
          <input
            type="text"
            placeholder="名前で検索"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
    
        {/* 交換したプロフィールの一覧 */}
        <div className="exchanged-profiles">
          <h2>交換したプロフィール</h2>
          <div className="profile-list">
            {exchangedProfiles.length > 0 ? (
              exchangedProfiles.map((profileId) => (
                <div key={profileId} className="profile-button">
                  <ProfileDetail userId={profileId} />
                </div>
              ))
            ) : (
              <p>交換したプロフィールがありません。</p>
            )}
          </div>
        </div>
    
        {/* 他のユーザーとプロフィール交換のセクション */}
        <div className="exchange-section">
          <h2>他のユーザーとプロフィールを交換</h2>
          <div className="profile-list">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => {
                const request = sentRequests.find((req) => req.targetUserId === user.id);
                const isApproved = exchangedProfiles.includes(user.id);
    
                return (
                  <div key={user.id} className="profile-card2">
                    <img
                      src={user.profile_picture_url || '/default-icon.png'}
                      alt={`${user.username}のアイコン`}
                      className="profile-icon"
                    />
                    <p>{user.username}</p>
                    {isApproved ? (
                      <p>交換済み</p>
                    ) : request ? (
                      <p>{request.status === 'pending' ? 'リクエスト保留中' : '交換済み'}</p>
                    ) : (
                      <button onClick={() => sendRequest(user.id)}>リクエストを送る</button>
                    )}
                  </div>
                );
              })
            ) : (
              <p>検索結果に一致するユーザーがいません。</p>
            )}
          </div>
        </div>
            

        {/* 承認リクエスト管理セクション */}
        <div className="approve-section">
          <h2>承認リクエスト</h2>
          <div className="request-list">
            {receivedRequests.length > 0 ? (
              receivedRequests.map((req) => (
                <div key={req.fromUserId} className="request-card">
                  <p>{req.fromUserId} からのリクエスト</p>
                  {req.status === 'pending' ? (
                    <button onClick={() => approveRequest(req.fromUserId)}>承認する</button>
                  ) : (
                    <p>承認済み</p>
                  )}
                </div>
              ))
            ) : (
              <p>承認待ちのリクエストはありません。</p>
            )}
          </div>
        </div>

        {/* login 情報を使用する例 */}
        <div>
          {user ? (
            <h1>Welcome, {user.email}! ({user.uid})</h1>
          ) : (
            <h1>Please sign in</h1>
          )}
        </div>
      </div>

      
    );
  }

export default MyPage;
