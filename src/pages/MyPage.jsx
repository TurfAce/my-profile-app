import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyPage.css';
import ProfileDetail from './ProfileDetail';
import { QRCodeCanvas } from 'qrcode.react';
import { useAuth } from '../AuthContext';
import { db } from './firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, getDocs } from 'firebase/firestore';
import QrScanner from 'react-qr-scanner';
import Modal from './Modal'; // モーダルコンポーネントをインポート

function MyPage() {
  const [exchangedProfiles, setExchangedProfiles] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sentRequests, setSentRequests] = useState([]);
  const [isQRCodeVisible, setIsQRCodeVisible] = useState(false); // QRコード表示モーダル状態
  const [isQRScannerVisible, setIsQRScannerVisible] = useState(false); // QRスキャナー表示モーダル状態
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [isRequestModalVisible, setIsRequestModalVisible] = useState(false); // 交換リクエスト表示モーダル状態
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false); // 検索バー表示モーダル状態
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

  const handleQRScan = (scannedData) => {
    if (scannedData) {
      // URLからユーザーIDを抽出
      const userId = scannedData.replace('http://localhost:3000/mypage/', '');
      alert(`QRコードをスキャンしました: ${userId}`);
      sendRequest(userId);
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

  const handleRequestModalToggle = async () => {
    if (!isRequestModalVisible) {
      // ユーザーが通知モーダルを開いたときに通知を既読としてマーク
      const currentUserRef = doc(db, 'users', currentUserId);
      const currentUserDoc = await getDoc(currentUserRef);
      if (currentUserDoc.exists()) {
        const userData = currentUserDoc.data();
        if (userData.receivedRequests) { // receivedRequestsが存在するか確認
          const updatedRequests = userData.receivedRequests.map((req) => ({
            ...req,
            read: true, // 既読としてマーク
          }));
          await updateDoc(currentUserRef, {
            receivedRequests: updatedRequests,
          });
          setReceivedRequests(updatedRequests);
        }
      }
    }
    setIsRequestModalVisible(!isRequestModalVisible);
  };

  const handleSearchModalToggle = () => {
    setIsSearchModalVisible(!isSearchModalVisible);
  };

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

    const handleScan = (result) => {
      if (result) {
        const data = result.text; // result.textにQRコードの文字列データが含まれます
        console.log('Scanned data:', data); // デバッグ用ログ出力
        try {
          const userId = data.replace('http://localhost:3000/mypage/', '');
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
            if (result) handleScan(result);
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
      const updatedReceivedRequests = currentUserData.receivedRequests.filter((req) => req.fromUserId !== fromUserId);

      await updateDoc(currentUserRef, {
        receivedRequests: updatedReceivedRequests,
        exchangedProfiles: arrayUnion(fromUserId),
      });

      const fromUserDoc = await getDoc(fromUserRef);
      const fromUserData = fromUserDoc.data();
      const updatedSentRequests = fromUserData.sentRequests.filter((req) => req.targetUserId !== currentUserId);

      await updateDoc(fromUserRef, {
        sentRequests: updatedSentRequests,
        exchangedProfiles: arrayUnion(currentUserId),
      });

      alert('リクエストを承認しました');
      setReceivedRequests(updatedReceivedRequests);
    } catch (error) {
      console.error('リクエスト承認エラー:', error);
      alert('リクエスト承認に失敗しました。');
    }
  };

  const countUnreadRequests = () => {
    return receivedRequests.filter(req => !req.read).length;
  };

  return (
    <div className="mypage-container">
      <div className="header">
        <div className="edit-button-container">
          <button className="edit-button" onClick={handleEditProfile}>EDIT</button>
        </div>
        <div className="notification-icon" onClick={handleRequestModalToggle}>
          <i className="fas fa-bell"></i>
          {countUnreadRequests() > 0 && <span className="notification-count">{countUnreadRequests()}</span>}
        </div>
        <div className="search-button-container">
          <button className="search-button" onClick={handleSearchModalToggle}>検索</button>
        </div>
      </div>

      <div className='qr-buttons'>
        <button onClick={handleQRCodeToggle}>
          {isQRCodeVisible ? 'Close QR' : 'Open QR'}
        </button>
        <button onClick={handleQRScannerToggle}>
          {isQRScannerVisible ? 'Close scanner' : 'Open scanner'}
        </button>
      </div>

      <Modal isOpen={isQRCodeVisible} onClose={handleQRCodeToggle}>
        <QRCodeGenerator userId={currentUserId} />
      </Modal>

      <Modal isOpen={isQRScannerVisible} onClose={handleQRScannerToggle}>
        <QRCodeScanner onScan={handleQRScan} />
      </Modal>

      <Modal isOpen={isRequestModalVisible} onClose={handleRequestModalToggle}>
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
      </Modal>

      <Modal isOpen={isSearchModalVisible} onClose={handleSearchModalToggle}>
        <div className="search-box">
          <input
            type="text"
            placeholder="名前で検索"
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <div className="profile-list">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div key={user.id} className="profile-card">
                  <img
                    src={user.profile_picture_url || '/default-icon.png'}
                    alt={`${user.username}のアイコン`}
                    className="profile-icon"
                  />
                  <p>{user.username}</p>
                  <button onClick={() => jumpToAnProfile(user.id)}>プロフィールを見る</button>
                </div>
              ))
            ) : (
              <p>検索結果に一致するユーザーがいません。</p>
            )}
          </div>
        </div>
      </Modal>

      <div className="icon-display">
        <span className="icon-placeholder">MeIsi</span>
      </div>

      <div className="exchanged-profiles">
        <h2>フレンドのプロフィール</h2>
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

      {/* <div className="exchange-section">
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
      </div> */}

      {/* <div className="approve-section">
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
      </div> */}
    </div>
  );
}

export default MyPage;