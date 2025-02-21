import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyPage.css';
import ProfileDetail from './ProfileDetail';
import { QRCodeCanvas } from 'qrcode.react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion, collection, getDocs, serverTimestamp } from 'firebase/firestore';
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
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false); // 設定モーダル状態
  const [isLabelModalVisible, setIsLabelModalVisible] = useState(false); // ラベル追加モーダル状態
  const [isBackTextModalVisible, setIsBackTextModalVisible] = useState(false); // 裏面編集モーダル状態
  const [currentProfileId, setCurrentProfileId] = useState(''); // 現在のプロフィールID
  const [newLabel, setNewLabel] = useState(''); // 新しいラベル
  const [labels, setLabels] = useState({}); // 追加されたラベルのリスト
  const [isSortModalVisible, setIsSortModalVisible] = useState(false); // ソートモーダル状態
  const [selectedSortLabel, setSelectedSortLabel] = useState(''); // 選択されたソートラベル
  const [backText, setBackText] = useState(''); // 裏面のテキスト
  const [lastUpdated, setLastUpdated] = useState(null); // 最後の更新時刻
  const [recentlyUpdatedProfiles, setRecentlyUpdatedProfiles] = useState([]); // 最近更新されたプロファイル
  const currentUserId = localStorage.getItem('userId');
  const [theme, setTheme] = useState(null); // 初期値を null に設定
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserTheme(); // ユーザーのテーマを取得
  }, [currentUserId]);

  useEffect(() => {
    if (theme !== null) { // theme が null でない場合にのみ適用
      applyTheme(theme);
      saveThemeToFirestore(theme); // テーマをFirestoreに保存
    }
  }, [theme]);

  useEffect(() => {
    fetchData();
  }, [currentUserId]);

  const fetchData = async () => {
    await fetchExchangedProfiles();
    await fetchAllUsers();
    await fetchRequests();
  };

  const fetchUserTheme = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUserId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.theme) {
          setTheme(data.theme); // ユーザーのテーマを設定
        } else {
          setTheme('white'); // デフォルトテーマを設定
        }
      }
    } catch (error) {
      console.error('テーマの取得エラー:', error);
      setTheme('white'); // エラー時にはデフォルトテーマを設定
    }
  };

  const fetchExchangedProfiles = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUserId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const profiles = data.exchangedProfiles || [];
        setExchangedProfiles(profiles);
        setLabels(data.labels || {});

        // Check if profiles were updated within the last 24 hours
        const now = new Date();
        const updatedProfiles = [];
        for (const profileId of profiles) {
          const profileDoc = await getDoc(doc(db, 'users', profileId));
          if (profileDoc.exists()) {
            const profileData = profileDoc.data();
            const lastUpdated = profileData.lastUpdated ? profileData.lastUpdated.toDate() : null;
            if (lastUpdated && (now - lastUpdated) < 24 * 60 * 60 * 1000) {
              updatedProfiles.push(profileId);
            }
          }
        }
        setRecentlyUpdatedProfiles(updatedProfiles);
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

  const handleSettingsModalToggle = () => {
    setIsSettingsModalVisible(!isSettingsModalVisible);
  };

  const handleBackTextModalToggle = () => {
    setIsBackTextModalVisible(!isBackTextModalVisible);
  };

  const handleThemeChange = (event) => {
    setTheme(event.target.value);
  };

  const applyTheme = (theme) => {
    const root = document.documentElement;
    switch (theme) {
      case 'white':
        root.style.setProperty('--theme-color', '#ffffff');
        root.style.setProperty('--header-color', '#f2f2f2');
        root.style.setProperty('--button-color', '#ffffff');
        root.style.setProperty('--text-color', '#000000');
        root.style.setProperty('--profile-color', '#333333');
        root.style.setProperty('--icon-color', '#000000');
        root.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.1)');
        root.style.setProperty('--bell-icon-color', '#d9d9d9');
        root.style.setProperty('--icondisplay-color', '#e6e6e6');
        root.style.setProperty('--text-shadow', '1px 1px 2px rgba(0, 0, 0, 0.5), -1px -1px 2px rgba(0, 0, 0, 0.5');
        break;
      case 'black':
        root.style.setProperty('--theme-color', '#333333');
        root.style.setProperty('--header-color', '#1a1a1a');
        root.style.setProperty('--button-color', '#444444');
        root.style.setProperty('--text-color', '#ffffff');
        root.style.setProperty('--profile-color', '#e0e0e0');
        root.style.setProperty('--icon-color', '#ffffff');
        root.style.setProperty('--shadow-color', 'rgba(77, 77, 77, 0.6)');
        root.style.setProperty('--bell-icon-color', '#ffffff');
        root.style.setProperty('--icondisplay-color', '#000000');
        root.style.setProperty('--text-shadow', '1px 1px 2px rgba(255, 255, 255, 0.5), -1px -1px 2px rgba(255, 255, 255, 0.5');
        break;
      case 'pink':
        root.style.setProperty('--theme-color', '#ffe4e1');
        root.style.setProperty('--header-color', '#ffcccb');
        root.style.setProperty('--button-color', '#ffe4e1');
        root.style.setProperty('--text-color', '#000000');
        root.style.setProperty('--profile-color', '#333333');
        root.style.setProperty('--icon-color', '#000000');
        root.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.1)');
        root.style.setProperty('--bell-icon-color', '#ffccd5'); 
        root.style.setProperty('--icondisplay-color', '#ffccd5');
        root.style.setProperty('--text-shadow', '1px 1px 2px rgba(255, 0, 162, 0.5), -1px -1px 2px rgba(255, 0, 162, 0.5');
        break;
      case 'blue':
          root.style.setProperty('--theme-color', '#e0f7fa');
          root.style.setProperty('--header-color', '#b2ebf2');
          root.style.setProperty('--button-color', '#e0f7fa');
          root.style.setProperty('--text-color', '#000000');
          root.style.setProperty('--profile-color', '#333333');
          root.style.setProperty('--icon-color', '#000000');
          root.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.1)');
          root.style.setProperty('--bell-icon-color', '#95d9f9'); 
          root.style.setProperty('--icondisplay-color', '#a4f6ff');
          root.style.setProperty('--text-shadow', '1px 1px 2px rgba(0, 103, 248, 0.5), -1px -1px 2px rgba(0, 103, 248, 0.5');
        break;
      default:
        break;
    }
  };

  const saveThemeToFirestore = async (theme) => {
    try {
      const userDocRef = doc(db, 'users', currentUserId);
      await updateDoc(userDocRef, { theme });
    } catch (error) {
      console.error('テーマの保存エラー:', error);
    }
  };

  const countUnreadRequests = () => {
    return receivedRequests.filter(req => !req.read).length;
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

    useEffect(() => {
      // Check if the browser supports media devices
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('このブラウザはQRコードスキャンをサポートしていません。');
      }
    }, []);

    const handleScan = (result) => {
      if (result) {
        const data = result.text;
        console.log('Scanned data:', data);
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

    const videoConstraints = {
      facingMode: 'environment', // Use the back camera
    };

    return (
      <div className="qr-scanner-container">
        <h3>QRコードをスキャンしてリクエスト送信</h3>
        <QrScanner
          delay={300}
          onError={handleError}
          onScan={handleScan}
          style={previewStyle}
          constraints={{ video: videoConstraints }} // Apply the video constraints
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
      fetchData(); // Refresh the data after approving the request
    } catch (error) {
      console.error('リクエスト承認エラー:', error);
      alert('リクエスト承認に失敗しました。');
    }
  };
  
  const addLabelToProfile = async () => {
    try {
      const profileRef = doc(db, 'users', currentUserId);
      const userDoc = await getDoc(profileRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        const updatedLabels = { ...data.labels };

        if (!updatedLabels[currentProfileId]) {
          updatedLabels[currentProfileId] = [];
        }
        updatedLabels[currentProfileId].push(newLabel);

        await updateDoc(profileRef, { labels: updatedLabels });
        setLabels(updatedLabels);
        fetchData(); // Refresh the data after adding the label
        setIsLabelModalVisible(false);
        setNewLabel('');
      }
    } catch (error) {
      console.error('ラベル追加エラー:', error);
    }
  };

  const handleAddLabel = (profileId) => {
    setCurrentProfileId(profileId);
    setIsLabelModalVisible(true);
  };

  const sortProfilesByLabel = (label) => {
    const sortedProfiles = Object.keys(labels).filter(profileId => {
      const profileLabels = labels[profileId] || [];
      return profileLabels.includes(label);
    });
    setExchangedProfiles(sortedProfiles);
    setSelectedSortLabel(label);
    setIsSortModalVisible(false);
  };

  const clearSort = () => {
    fetchExchangedProfiles();
    setSelectedSortLabel('');
    setIsSortModalVisible(false);
  };

  const handleBackTextChange = (event) => {
    setBackText(event.target.value);
  };

  const handleSaveBackText = async () => {
    try {
      const userDocRef = doc(db, 'users', currentUserId);
      await updateDoc(userDocRef, { additionalInfo: backText, lastUpdated: serverTimestamp() });
      setLastUpdated(new Date());
      alert('裏面の情報を保存しました');
      setIsBackTextModalVisible(false);
    } catch (error) {
      console.error('裏面の情報保存中にエラーが発生しました', error);
    }
  };

  const handleViewBackSide = (profileId) => {
    setRecentlyUpdatedProfiles(recentlyUpdatedProfiles.filter(id => id !== profileId));
    // Here you can add additional logic to show the back side
  };

  return (
    <div className="mypage-container" style={{ background: 'var(--theme-color)' }}>
      <div className="header" style={{ background: 'var(--header-color)' }}>
        <div className="notification-icon" onClick={handleRequestModalToggle}>
          <i className="fas fa-bell"></i>
          {countUnreadRequests() > 0 && <span className="notification-count">{countUnreadRequests()}</span>}
        </div>
        <div className="search-button-container">
          <button className="search-button" style={{ background: 'var(--button-color)' }} onClick={() => setIsSortModalVisible(true)}>
            <i className='fa-solid fa-list'></i>
          </button>
        </div>
      </div>

      <div className='qr-buttons'>
        <button onClick={handleQRCodeToggle} style={{ background: 'var(--button-color)' }}>
          <i className="fa-solid fa-qrcode"></i>
        </button>
        <button onClick={handleQRScannerToggle} style={{ background: 'var(--button-color)' }}>
          <i className="fa-solid fa-camera"></i>
        </button>
      </div>

      {selectedSortLabel && (
        <div className="clear-sort-button-container">
          <button onClick={clearSort} style={{ background: 'var(--button-color)' }}>
            ソート解除
          </button>
        </div>
      )}

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

      <Modal isOpen={isSettingsModalVisible} onClose={handleSettingsModalToggle}>
        <div className="settings-list">
          <h2>Settings</h2>
          <div className="theme-selector">
            <label>
              <input type="radio" value="white" checked={theme === 'white'} onChange={handleThemeChange} />
              White
            </label>
            <label>
              <input type="radio" value="black" checked={theme === 'black'} onChange={handleThemeChange} />
              Black
            </label>
            <label>
              <input type="radio" value="pink" checked={theme === 'pink'} onChange={handleThemeChange} />
              Pink
            </label>
            <label>
              <input type="radio" value="blue" checked={theme === 'blue'} onChange={handleThemeChange} />
              Blue
            </label>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isLabelModalVisible} onClose={() => setIsLabelModalVisible(false)}>
        <div className="label-box">
          <h2>ラベルを追加</h2>
          <input
            type="text"
            placeholder="ラベルを入力"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
          />
          <button onClick={addLabelToProfile}>追加</button>
        </div>
      </Modal>

      <Modal isOpen={isSortModalVisible} onClose={() => setIsSortModalVisible(false)}>
        <div className="sort-box">
          <h2>ラベルでソート</h2>
          <div>
            {Array.from(new Set(Object.values(labels).flat())).map((label, index) => (
              <button
                key={index}
                className={`label-item ${selectedSortLabel === label ? 'selected' : ''}`}
                onClick={() => sortProfilesByLabel(label)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </Modal>

      <Modal isOpen={isBackTextModalVisible} onClose={handleBackTextModalToggle}>
        <div className="back-text-box">
          <h2>裏面の情報を編集</h2>
          <textarea
            placeholder="裏面の情報を入力"
            value={backText}
            onChange={handleBackTextChange}
          />
          <button onClick={handleSaveBackText}>保存</button>
        </div>
      </Modal>

      <div className="icon-display">
        <span className="icon-placeholder">MeIsi</span>
      </div>

      <div className="exchanged-profiles">
        <h2 className='friendsprofile'>フレンドのプロフィール</h2>
        <div className="profile-list-horizontal">
          {exchangedProfiles.length > 0 ? (
            exchangedProfiles.map((profileId) => (
              <div 
                key={profileId} 
                className={`profile-button ${recentlyUpdatedProfiles.includes(profileId) ? 'rainbow-border' : ''}`}
                onClick={() => handleViewBackSide(profileId)}
              >
                <ProfileDetail userId={profileId} />
                <button className="fa-solid fa-tags" onClick={() => handleAddLabel(profileId)}></button>
                <div className="label-list">
                  {labels[profileId] && labels[profileId].map((label, index) => (
                    <span key={index} className="profile-label">{label}</span>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p>交換したプロフィールがありません。</p>
          )}
        </div>
      </div>

      <div className="bottom-nav">
        <button onClick={handleEditProfile}>
          <i className="fas fa-pencil-alt"></i>
          <span>Edit</span>
        </button>
        <button onClick={handleSettingsModalToggle}>
          <i className="fa-solid fa-cog"></i>
          <span>Settings</span>
        </button>
        <button onClick={handleBackTextModalToggle}>
          <i className="fa-solid fa-file-alt"></i>
          <span>裏面編集</span>
        </button>
      </div>
    </div>
  );
}

export default MyPage;