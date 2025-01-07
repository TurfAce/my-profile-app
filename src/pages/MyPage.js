import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyPage.css';
import ProfileDetail from './ProfileDetail';
import { QRCodeCanvas } from 'qrcode.react';
import { useAuth } from '../AuthContext';
import { db } from './firebase';
import { doc, getDoc, updateDoc, setDoc, arrayUnion, collection, getDocs } from 'firebase/firestore';
import QrScanner from 'react-qr-scanner';

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

    const fetchAllUsers = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const querySnapshot = await getDocs(usersCollection);
        const users = [];
        querySnapshot.forEach((doc) => {
          if (doc.id !== currentUserId) {
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

  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);

    if (query) {
      const filtered = allUsers.filter((user) =>
        user.username.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers([]);
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
      await updateDoc(currentUserRef, {
        sentRequests: arrayUnion({
          targetUserId: targetUserId,
          status: 'pending',
        }),
      });

      await updateDoc(targetUserRef, {
        receivedRequests: arrayUnion({
          fromUserId: currentUserId,
          status: 'pending',
        }),
      });

      alert('リクエストを送信しました');
    } catch (error) {
      console.error('リクエスト送信エラー:', error);
      alert('リクエスト送信に失敗しました。もう一度お試しください。');
    }
  };

  const handleQRScan = (data) => {
    if (data) {
      alert(`QRコードをスキャンしました: ${data}`);
      setIsQRScannerVisible(false);
    }
  };

  const handleQRScannerToggle = () => {
    setIsQRScannerVisible(!isQRScannerVisible);
    setIsQRCodeVisible(false);
  }

  const handleQRCodeToggle = () => { 
    setIsQRCodeVisible(!isQRCodeVisible);
    setIsQRScannerVisible(false);
  }

  const QRCodeGenerator = ({ userId }) => {
    const qrValue = `http://localhost:3000/mypage/${userId}`;

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
        try {
          const userId = data.includes('your-app://exchange/') 
            ? data.replace('your-app://exchange/', '') 
            : data;
          onScan(userId);
        } catch (err) {
          console.error('スキャンデータの処理エラー:', err);
        }
      }
    };

    const handleError = (err) => {
      console.error('QRコードスキャンエラー:', err);
      setError('QRコードをスキャンできませんでした。もう一度試してください。');
    };

    const previewStyle = {
      height: 240,
      width: 320,
    };

    return (
      <div className="qr-scanner-container">
        <h3>QRコードをスキャンしてリクエスト送信</h3>
        <QrScanner
          delay={300}
          onError={handleError}
          onScan={handleScan}
          style={previewStyle}
          onResult={(result, error) => {
            if (result) handleScan(result.text);
          }}
        />
        {error && <p className="error-message">{error}</p>}
      </div>
    );
  };

  const approveRequest = async (fromUserId) => {
    const currentUserRef = doc(db, 'users', currentUserId);
    const fromUserRef = doc(db, 'users', fromUserId);

    try {
      const currentUserDoc = await getDoc(currentUserRef);
      const currentUserData = currentUserDoc.data();
      const updatedReceivedRequests = currentUserData.receivedRequests.map((req) =>
        req.fromUserId === fromUserId ? { ...req, status: 'approved' } : req
      );

      await updateDoc(currentUserRef, {
        receivedRequests: updatedReceivedRequests,
        exchangedProfiles: arrayUnion(fromUserId),
      });

      const fromUserDoc = await getDoc(fromUserRef);
      const fromUserData = fromUserDoc.data();
      const updatedSentRequests = fromUserData.sentRequests.map((req) =>
        req.targetUserId === currentUserId ? { ...req, status: 'approved' } : req
      );

      await updateDoc(fromUserRef, {
        sentRequests: updatedSentRequests,
        exchangedProfiles: arrayUnion(currentUserId),
      });

      alert('リクエストを承認しました');
    } catch (error) {
      console.error('リクエスト承認エラー:', error);
      alert('リクエスト承認に失敗しました。');
    }
  };

  return (
    <div className="mypage-container">
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
        {isQRScannerVisible && <QRCodeScanner onScan={handleQRScan} />}
      </div>

      <div className="icon-display">
        <span className="icon-placeholder">マイページ</span>
      </div>

      <div className="search-box">
        <input
          type="text"
          placeholder="名前で検索"
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

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