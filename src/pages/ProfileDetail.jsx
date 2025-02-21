import React, { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faTwitter, faInstagram, faGithub } from '@fortawesome/free-brands-svg-icons';

function ProfileDetail({ userId }) {
  const [profile, setProfile] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [backText, setBackText] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const currentUserId = localStorage.getItem('userId'); // 現在のユーザーIDを取得

  useEffect(() => {
    const fetchProfile = async () => {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setProfile(userData);
        setBackText(userData.additionalInfo || '');
        setLastUpdated(userData.lastUpdated?.toDate() || null);
      } else {
        console.error('プロフィールが見つかりません');
      }
    };
    fetchProfile();
  }, [userId]);

  const handleSendRequest = async () => {
    try {
      const userDocRef = doc(db, 'users', currentUserId);
      const targetUserDocRef = doc(db, 'users', userId);

      // 交換リクエストを現在のユーザーのドキュメントに追加
      await updateDoc(userDocRef, {
        exchangeRequests: arrayUnion(userId),
      });

      // 交換リクエストを対象ユーザーのドキュメントにも追加
      await updateDoc(targetUserDocRef, {
        exchangeRequests: arrayUnion(currentUserId),
      });

      alert('交換リクエストを送信しました');
    } catch (error) {
      console.error('交換リクエスト送信中にエラーが発生しました', error);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleBackTextChange = (event) => {
    setBackText(event.target.value);
  };

  const handleSaveBackText = async () => {
    if (lastUpdated && (new Date() - lastUpdated) < 24 * 60 * 60 * 1000) {
      alert('裏面の情報は1日に一度のみ変更できます。');
      return;
    }

    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, { additionalInfo: backText, lastUpdated: serverTimestamp() });
      setLastUpdated(new Date());
      alert('裏面の情報を保存しました');
    } catch (error) {
      console.error('裏面の情報保存中にエラーが発生しました', error);
    }
  };

  if (!profile) {
    return <p>プロフィールを読み込み中...</p>;
  }

  return (
    <div className="profile-detail">
      {isFlipped ? (
        <div className="profile-back">
          <textarea value={backText} onChange={handleBackTextChange} />
          <button onClick={handleFlip}>表面を見る</button>
        </div>
      ) : (
        <div className="profile-front">
          <img src={profile.profile_picture_url} alt={`${profile.username}のプロフィール`} className="profile-img" />
          <h3>{profile.username}</h3>
          <p>{profile.bio}</p>
          <div className="social-links">
            {profile.social_links ? (
              profile.social_links.split(',').map((link) => {
                if (link.includes('facebook.com')) {
                  return (
                    <a href={link} target="_blank" rel="noopener noreferrer" key={link}>
                      <FontAwesomeIcon icon={faFacebook} size="2x" />
                    </a>
                  );
                } else if (link.includes('x.com')) {
                  return (
                    <a href={link} target="_blank" rel="noopener noreferrer" key={link}>
                      <FontAwesomeIcon icon={faTwitter} size="2x" />
                    </a>
                  );
                } else if (link.includes('instagram.com')) {
                  return (
                    <a href={link} target="_blank" rel="noopener noreferrer" key={link}>
                      <FontAwesomeIcon icon={faInstagram} size="2x" />
                    </a>
                  );
                } else if (link.includes('github.com')) {
                  return (
                    <a href={link} target="_blank" rel="noopener noreferrer" key={link}>
                      <FontAwesomeIcon icon={faGithub} size="2x" />
                    </a>
                  );
                }
                return null;
              })
            ) : (
              <p>ソーシャルリンクがありません</p>
            )}
          </div>
          <button onClick={handleFlip}>裏面を見る</button>
        </div>
      )}
    </div>
  );
}

export default ProfileDetail;