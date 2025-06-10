import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import './MyPage.css';
import ProfileDetail from './ProfileDetail';
import { QRCodeCanvas } from 'qrcode.react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import QrScanner from 'react-qr-scanner';
import Modal from './Modal'; // モーダルコンポーネントをインポート
import Cookies from 'js-cookie';
import Trophies from './Trophies'; 
import TutorialPage from './TutorialPage';
import UserProfilePage from './ProfilePage';

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
  const [viewedProfiles, setViewedProfiles] = useState([]); // 表示されたプロファイル
  const currentUserId = localStorage.getItem('userId');
  const [theme, setTheme] = useState(null); // 初期値を null に設定
  const [backImageChangeCount, setBackImageChangeCount] = useState(0);
  const [isNFCModalVisible, setIsNFCModalVisible] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [nfcReadData, sentNfcReadData] = useState([]);
  const [nfcError, setNfcError] = useState('');
  const [nfcProgress, setNfcProgress] = useState([]);
  const [writtenData, setWrittenData] = useState('');

  const [backImage, setBackImage] = useState(null);
  const [nextUpdate, setNextUpdate] = useState(null);
  const ONE_DAY = 24 * 60 * 60 * 1000;

  const [isTrophiesModalVisible, setIsTrophiesModalVisible] = useState(false); 
  const [isTutorialModalVisible, setIsTutorialModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

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
    // クッキーからviewedProfilesを読み込む
    const viewedProfilesCookie = Cookies.get('viewedProfiles');
    if (viewedProfilesCookie) {
      setViewedProfiles(JSON.parse(viewedProfilesCookie));
    }
  }, [currentUserId]);

  useEffect(() => {
    if(!searchQuery){
      setFilteredUsers(allUsers);
    } else {
      setFilteredUsers(
        allUsers.filter(user =>
        (user.username || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, allUsers]);

  const fetchData = async () => {
    await fetchExchangedProfiles();
    await fetchAllUsers();
    await fetchRequests();

    const userDoc = await getDoc(doc(db, 'users', currentUserId));
    if(userDoc.exists()){
      const userData = userDoc.data();
      setBackImageChangeCount(userData.backImageChangeCount || 0);
    }
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

  // const handleEditProfile = () => {
  //   navigate(`/login/${currentUserId}`);
  // };


  const jumpToAnProfile = (userId) => {
    navigate(`/login/${userId}`);
  };

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

  const isNFCSupported = () => {
    if ('NDEFReader' in window) {
      return true;
    } else {
      alert('お使いのデバイスやブラウザはNFCをサポートしていません。');
      return false;
    }
  };

  const sendNFCRequest = async (nfcData) => {
    const currentUserRef = doc(db, 'users', currentUserId);
  
    try {
      if (!nfcData) {
        alert('NFCデータが空です。もう一度試してください。');
        return;
      }
  
      // 読み取ったNFCデータをtargetUserIdとみなす
      const targetUserId = nfcData.trim();
      const targetUserRef = doc(db, 'users', targetUserId);
  
      // Firestoreの更新処理
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
  
      alert(`リクエストを送信しました: ${targetUserId}`);
    } catch (error) {
      console.error('NFCリクエスト送信エラー:', error);
      alert('NFCリクエスト送信に失敗しました。もう一度お試しください。');
    }
  };

  // const handleNFCWrite = async () => {
  //   if ('NDEFReader' in window) {
  //     try {
  //       console.log('NFCリーダーを初期化中...');
  //       const ndef = new NDEFReader();
  
  //       console.log('NFCタグへのデータ書き込みを開始します...');
  //       await ndef.write({
  //         records: [{ recordType: "text", data: currentUserId }],
  //       });
  
  //       console.log('NFCタグにデータを書き込みました！');
  //       alert('NFCにデータを書き込みました！');
  //     } catch (error) {
  //       console.error('NFC書き込みエラー:', error);
  //       alert(`NFC書き込みに失敗しました。詳細: ${error.message}`);
  //     }
  //   } else {
  //     alert('このデバイスやブラウザはNFC機能をサポートしていません。');
  //   }
  // };
  const handleNFCWriteFromFirestore = async () => {
    if (!isNFCSupported()) {
      return;
    }
  
    try {
      // Firestoreから現在のユーザーのデータを取得
      const userDoc = await getDoc(doc(db, 'users', currentUserId)); // `currentUserId`はログイン中のユーザーID
      if (!userDoc.exists()) {
        alert('Firestoreにユーザー情報が見つかりません。');
        return;
      }
  
      // Firestoreから取得した`uid`
      const uid = userDoc.data()?.uid;
      if (!uid) {
        alert('Firestoreでuidが見つかりません。');
        return;
      }
  
      const ndef = new NDEFReader();
  
      // NFCタグにuidを書き込む
      await ndef.write({
        records: [{ recordType: "text", data: uid }]
      });
  
      // 書き込んだデータを保存 (UIで表示)
      setWrittenData(uid);
      alert(`NFCタグにユーザーID(${uid})を書き込みました！`);
    } catch (error) {
      console.error('NFC書き込みエラー:', error);
      alert(`NFC書き込みに失敗しました: ${error.message}`);
    }
  };
      
  const handleNFCRead = async () => {
    if (!isNFCSupported()) {
      return;
    }
  
    try {
      const ndef = new NDEFReader();
      await ndef.scan();
      ndef.onreading = (event) => {
        const decoder = new TextDecoder();
        for (const record of event.message.records) {
          if (record.recordType === "text") {
            const userId = decoder.decode(record.data).trim();
            sendRequest(userId); // 読み取ったIDでリクエスト送信
            alert(`NFCデータを読み取りました: ${userId}`);
          }
        }
      };
    } catch (error) {
      console.error('NFC読み取りエラー:', error);
      alert(`NFC読み取りに失敗しました: ${error.message}`);
    }
  };

  const handleNFCYomikomi = async () => {
    if ('NDEFReader' in window) {
      setNfcProgress(['NFCリーダーの初期化を開始しました']);
      try {
        const ndef = new NDEFReader();
        await ndef.scan();
        setNfcProgress((prev) => [...prev, 'NFCタグのスキャンを開始しました']);
  
        ndef.onreading = (event) => {
          setNfcProgress((prev) => [...prev, 'NFCタグの読み取りイベントがトリガーされました']);
          const decoder = new TextDecoder();
          for (const record of event.message.records) {
            if (record.recordType === 'text') {
              const userId = decoder.decode(record.data).trim();
              setNfcProgress((prev) => [...prev, `データを読み取りました: ${userId}`]);
              
              // 読み取ったデータでリクエストを送信
              sendNFCRequest(userId);
              break;
            }
          }
        };
      } catch (error) {
        console.error('NFC読み取りエラー:', error);
        alert('NFC読み取りに失敗しました');
      }
    } else {
      alert('お使いのブラウザはNFC APIをサポートしていません');
    }
  };


  const handleNFCModalToggle = () => {
    setIsNFCModalVisible(!isNFCModalVisible);
  }

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
  };

  const handleQRCodeToggle = () => {
    setIsQRCodeVisible(!isQRCodeVisible);
    setIsQRScannerVisible(false);
  };

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

  const MAX_FILE_SIZE = 2 * 1024 * 1024;

  const handleBackImageChange = (e) => {
    const file = e.target.files[0];
    if(file && file.size > MAX_FILE_SIZE) {
      alert('too big');
      return;
    }
    if(file){
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
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

      // alert('リクエストを承認しました');
      setToastMessage('🎉 交換が成立しました！');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
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
    // if (lastUpdated && (new Date() - lastUpdated) < 24 * 60 * 60 * 1000) {
    //   alert('裏面の情報は1日に一度のみ変更できます。');
    //   return;
    // }
    try {
      const userDocRef = doc(db, 'users', currentUserId);
      await updateDoc(userDocRef, { 
        backImage: backImage, 
        lastUpdated: serverTimestamp(),
        backImageChangeCount: backImageChangeCount + 1 // 変更回数をインクリメント
      });
      setLastUpdated(new Date());
      setBackImageChangeCount(backImageChangeCount + 1); // ローカルステートも更新
      alert('裏面の情報を保存しました');
      setIsBackTextModalVisible(false);
    } catch (error) {
      console.error('裏面の情報保存中にエラーが発生しました', error);
    }
  };
  


  const handleViewBackSide = async (profileId) => {
    const updatedViewedProfiles = [...viewedProfiles, profileId];
    setRecentlyUpdatedProfiles(recentlyUpdatedProfiles.filter(id => id !== profileId));
    setViewedProfiles(updatedViewedProfiles);
    // Mark the profile as viewed in Cookies
    Cookies.set('viewedProfiles', JSON.stringify(updatedViewedProfiles), { expires: 365 });
  };


  const handleTrophiesModalToggle = () => {
    setIsTrophiesModalVisible(!isTrophiesModalVisible);
  };

  const handleTutorialModalToggle = () => {
    setIsTutorialModalVisible(!isTutorialModalVisible);
  }

  const handleEditModalToggle = () => {
    setIsEditModalVisible(!isEditModalVisible);
  }

  return (
      <div className="mypage-container" style={{ background: 'var(--theme-color)' }}>
        {showToast && (
          <div className="custom-toast">{toastMessage}</div>
        )}
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

          <Modal isOpen={isBackTextModalVisible} onClose={() => setIsBackTextModalVisible(false)}>
            <div className="back-text-box">
              <h2>裏面の画像をアップロード</h2>
              <input
                type="file"
                accept="image/*"
                onChange={handleBackImageChange}
              />
              <button onClick={handleSaveBackText}>保存</button>
            </div>
          </Modal>
          
          <div className="icon-display">
              <span className="icon-placeholder">MeIsi</span>
          </div>

          <div className="exchanged-profiles">
              {exchangedProfiles.length > 0 && (
                  <h2 className='friendsprofile'>フレンドのプロフィール</h2>
              )}
              <input
                className="namesarchbox"
                type="text"
                placeholder="名前で検索"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {/* <div className="carousel">
                  {exchangedProfiles.length > 0 ? (
                      exchangedProfiles.map((profileId) => (
                          <div 
                              key={profileId} 
                              className={`carousel-item ${recentlyUpdatedProfiles.includes(profileId) && !viewedProfiles.includes(profileId) ? 'rainbow-border' : ''}`}
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
                      <p>まだ交換したプロフィールがありません。<br />友達を見つけてプロフィールを交換してみましょう！</p>
                  )}
              </div> */}

                <div className='carousel'>
                  {exchangedProfiles.length > 0 ? (
                    allUsers
                      .filter(user =>
                        // 「自分が持っているカード」かつ「検索条件に一致」
                        exchangedProfiles.includes(user.id) &&
                        (user.username || '')
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase())
                      )
                      .map((user) => (
                        <div
                          key={user.id}
                          className={`carousel-item ${
                            recentlyUpdatedProfiles.includes(user.id) && !viewedProfiles.includes(user.id)
                              ? 'rainbow-border'
                              : ''
                          }`}
                          onClick={() => handleViewBackSide(user.id)}
                        >
                          <ProfileDetail userId={user.id} />
                          <button className="fa-solid fa-tags" onClick={() => handleAddLabel(user.id)}></button>
                          <div className='label-list'>
                            {labels[user.id] &&
                              labels[user.id].map((label, index) => (
                                <span key={index} className='profile-label'>{label}</span>
                              ))}
                          </div>
                        </div>
                      ))
                  ) : (
                    <p>まだ交換したプロフィールがありません。<br />友達を見つけてプロフィールを交換してみましょう！</p>
                  )}
                </div>
              </div>
          {/* <button className="tutorial-button" onClick={handleTutorialModalToggle}>Help</button>
          <Modal isOpen={isTutorialModalVisible} onClose={handleTutorialModalToggle}>
              <TutorialPage /> 
          </Modal> */}
          {/* <div className="nfc-buttons"> */}
            {/* <button onClick={handleNFCWrite} className="nfc-button">
              NFCで送信
            </button> */}
            {/* <button onClick={handleNFCYomikomi} className="nfc-button">
              NFCで受信
            </button> */}
            {/* <button onClick={handleNFCWriteFromFirestore} className="nfc-button">
              NFCで送信
            </button>
            <div>
              <h3>書き込んだ内容</h3>
              {writtenData ? (
                <p>
                  書き込んだデータ: <strong>{writtenData}</strong>
                </p>
              ) : (
                <p>まだNFCにデータを書き込んでいません</p>
              )}
            </div>
            <button onClick={handleNFCRead} className="nfc-button">
                    NFCで受信
            </button>
            <div>
              <h3>NFC進捗状況</h3>
              <ul>
                {nfcProgress.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
              {nfcError && (
                <div>
                  <h4>エラーが発生しました</h4>
                  <p>{nfcError}</p>
                </div>
              )}
            </div>
          </div> */}

          <Modal isOpen={isNFCModalVisible} onClose={handleNFCModalToggle}>
            <h2>NFC交換機能</h2>
            <p>スマートフォンを近づけて名刺情報を交換してください。</p>
          </Modal>


          <div className="bottom-nav">
              <button onClick={handleEditModalToggle}>
                  <i className="fas fa-pencil-alt"></i>
                  <span>Edit</span>
              </button>
              <Modal isOpen={isEditModalVisible} onClose={handleEditModalToggle}>
                  <UserProfilePage/>
              </Modal>
              <button onClick={handleSettingsModalToggle}>
                  <i className="fa-solid fa-paint-roller"></i>
                  <span>Color</span>
              </button>
              <button onClick={handleBackTextModalToggle}>
                  <i className="fa-solid fa-film"></i>
                  <span>1/1 story</span>
              </button>
              <button onClick={handleTrophiesModalToggle}>
                <i className='fa-solid fa-trophy'></i>
                <span>実績</span>
              </button>
              <Modal isOpen={isTrophiesModalVisible} onClose={handleTrophiesModalToggle}>
                <Trophies exchangeCount={exchangedProfiles.length} backImageChangeCount={backImageChangeCount} />
              </Modal>
              <button onClick={handleTutorialModalToggle}>
                <i className="fa-solid fa-question" ></i>
                <span>Help</span>
              </button> 
              <Modal isOpen={isTutorialModalVisible} onClose={handleTutorialModalToggle}>
                  <TutorialPage /> 
              </Modal>
          </div>
      </div>
  );
}
    
export default MyPage;
