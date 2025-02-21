import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Modal from './Modal2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faTwitter, faInstagram, faSquareInstagram, faGithub } from '@fortawesome/free-brands-svg-icons';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import './ProfilePage.css';

function UserProfilePage() {
  const { user } = useAuth();
  const { userId } = useParams();
  const [profile, setProfile] = useState({
    username: '',
    bio: '',
    profile_picture_url: '',
    social_links: '',
    additionalInfo: '',
    lastUpdated: null,
  });
  const [editMode, setEditMode] = useState(false);
  const [addLinkMode, setAddLinkMode] = useState(false);
  const [newLinkPlatform, setNewLinkPlatform] = useState('');
  const [newLinkUserId, setNewLinkUserId] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [backText, setBackText] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setProfile(userData);
        setBackText(userData.additionalInfo || '');
        setLastUpdated(userData.lastUpdated?.toDate() || null);
      } else {
        console.error('No such document!');
      }
    };
    fetchProfile();
  }, [userId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleSave = async () => {
    try {
      const userDoc = doc(db, 'users', userId);
      await updateDoc(userDoc, profile);
      setEditMode(false);

      const isNewuser = localStorage.getItem('isNewuser') === 'true';
      if (isNewuser) {
        localStorage.setItem('isNewuser', 'false');
      }
      navigate(`/mypage/${userId}`);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleImageLoad = () => setImageLoaded(true);

  const renderSocialLinks = (links) =>
    links.split(',').map((link) => {
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
    });

  const handleAddSocialLink = (platform) => {
    setNewLinkPlatform(platform);
    setAddLinkMode(true);
  };

  const handleAddLinkSave = () => {
    let newLink = '';
    if (newLinkPlatform === 'Twitter') {
      newLink = `https://x.com/${newLinkUserId}`;
    } else if (newLinkPlatform === 'Instagram') {
      newLink = `https://instagram.com/${newLinkUserId}`;
    } else if (newLinkPlatform === 'GitHub') {
      newLink = `https://github.com/${newLinkUserId}`;
    }
    setProfile({ ...profile, social_links: profile.social_links ? `${profile.social_links},${newLink}` : newLink });
    setAddLinkMode(false);
    setNewLinkUserId('');
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

  return (
    <div className="profile-container">
      <h2>プロフィール</h2>
      <div className="profile-card">
        {profile.profile_picture_url ? (
          <img
            src={profile.profile_picture_url}
            alt="Profile"
            className={imageLoaded ? 'fade-in' : 'hidden'}
            onLoad={handleImageLoad}
          />
        ) : (
          <p>プロフィール画像がありません</p>
        )}
        <h3>{profile.username || 'ユーザー名がありません'}</h3>
        <p>{profile.bio || '自己紹介がありません'}</p>
        <p>
          ソーシャルリンク: {profile.social_links ? renderSocialLinks(profile.social_links) : 'リンクがありません'}
        </p>
        <button onClick={handleFlip}>
          {isFlipped ? '表面を見る' : '裏面を見る'}
        </button>
        {isFlipped ? (
          <div className="profile-back">
            <p>裏面の情報</p>
            <p>{profile.additionalInfo}</p>
            {user && user.uid === userId && (
              <div>
                <textarea value={backText} onChange={handleBackTextChange} />
                <button onClick={handleSaveBackText}>保存</button>
              </div>
            )}
          </div>
        ) : (
          <div>
            {user && user.uid === userId ? (
              <div>
                <button className="primary" onClick={() => setEditMode(true)}>プロフィール編集</button>
                <button className="primary1" onClick={() => navigate(`/mypage/${userId}`)}>マイページへ</button>
              </div>
            ) : (
              <div><span>(Other's card or not signed in)</span></div>
            )}
          </div>
        )}
      </div>

      <Modal isOpen={editMode} onClose={() => setEditMode(false)}>
        <div className="profile-edit-form">
          <input
            type="text"
            name="username"
            value={profile.username || ''}
            onChange={handleInputChange}
            placeholder="ユーザー名を入力"
          />
          <input
            type="text"
            name="bio"
            value={profile.bio || ''}
            onChange={handleInputChange}
            placeholder="自己紹介を入力"
          />
          <input
            type="text"
            name="profile_picture_url"
            value={profile.profile_picture_url || ''}
            onChange={handleInputChange}
            placeholder="プロフィール画像のURLを入力"
          />
          <input
            type="text"
            name="social_links"
            value={profile.social_links || ''}
            onChange={handleInputChange}
            placeholder="ソーシャルリンクを入力"
          />
          <div className="social-buttons">
            <button className="twitter-button" onClick={() => handleAddSocialLink('Twitter')}>
              <FontAwesomeIcon icon={faTwitter} size="xl" /> Twitterリンクを追加
            </button>
            <button className="instagram-button" onClick={() => handleAddSocialLink('Instagram')}>
              <FontAwesomeIcon icon={faSquareInstagram} size="xl" /> Instagramリンクを追加
            </button>
            <button className="github-button" onClick={() => handleAddSocialLink('GitHub')}>
              <FontAwesomeIcon icon={faGithub} size="xl" /> GitHubリンクを追加
            </button>
          </div>
          <div className="modal-actions">
            <button onClick={() => setEditMode(false)}>キャンセル</button>
            <button onClick={handleSave}>保存</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={addLinkMode} onClose={() => setAddLinkMode(false)}>
        <div className="add-link-form">
          <h3>{newLinkPlatform}のユーザーIDを入力</h3>
          <input
            type="text"
            value={newLinkUserId}
            onChange={(e) => setNewLinkUserId(e.target.value)}
            placeholder={`${newLinkPlatform}のユーザーID`}
          />
          <div className="modal-actions">
            <button onClick={() => setAddLinkMode(false)}>キャンセル</button>
            <button onClick={handleAddLinkSave}>追加</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default UserProfilePage;