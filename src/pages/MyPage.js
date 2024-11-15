import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyPage.css';
import ProfileDetail from './ProfileDetail';  // ProfileDetailのインポート

import { db } from './firebase';
import { doc, getDoc, updateDoc, arrayUnion, collection, getDocs } from 'firebase/firestore';

function MyPage() {
  const [exchangedProfiles, setExchangedProfiles] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);  // 検索結果を格納するstate
  const [searchQuery, setSearchQuery] = useState('');  // 検索キーワード
  const currentUserId = localStorage.getItem('userId');
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

    fetchExchangedProfiles();
    fetchAllUsers();
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

  // プロフィール交換処理
  const handleExchangeProfile = async (targetUserId) => {
    const userDocRef = doc(db, 'users', currentUserId);
    const targetUserDocRef = doc(db, 'users', targetUserId);

    try {
      // 現在のユーザーの exchangedProfiles に対象ユーザーを追加
      await updateDoc(userDocRef, {
        exchangedProfiles: arrayUnion(targetUserId),
      });

      // 対象ユーザーの exchangedProfiles に現在のユーザーを追加
      await updateDoc(targetUserDocRef, {
        exchangedProfiles: arrayUnion(currentUserId),
      });

      alert('プロフィールを交換しました！');

      // 交換済みプロフィールの状態を更新
      setExchangedProfiles((prev) => [...prev, targetUserId]);

    } catch (error) {
      console.error('プロフィール交換エラー:', error);
      alert('プロフィール交換に失敗しました。もう一度お試しください。');
    }
  };

  // プロフィール編集ページへのリダイレクト
  const handleEditProfile = () => {
    navigate(`/login/${currentUserId}`);
  };

  return (
    <div className="mypage-container">
      {/* カード編集ボタン */}
      <div className="edit-button-container">
        <button className="edit-button" onClick={handleEditProfile}>カード編集</button>
      </div>

      {/* アイコン表示 */}
      <div className="icon-display">
        <span className="icon-placeholder">アイコン</span> {/* 今は文字でアイコンを表示 */}
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
                {/* 実際には profileId を使用して詳細情報を表示 */}
                <ProfileDetail userId={profileId} />
              </div>
            ))
          ) : (
            <p>交換したプロフィールがありません。</p>
          )}
        </div>
      </div>

      {/* 検索結果で表示する他のユーザーとプロフィールを交換するセクション */}
      <div className="exchange-section">
        <h2>他のユーザーとプロフィールを交換</h2>
        <div className="profile-list">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div key={user.id} className="profile-card">
                <p>{user.username}</p>
                <button onClick={() => handleExchangeProfile(user.id)}>交換する</button>
              </div>
            ))
          ) : (
            <p>検索結果に一致するユーザーがいません。</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyPage;
