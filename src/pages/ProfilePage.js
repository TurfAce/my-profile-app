// UserProfilePage.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Modal from './Modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faTwitter, faInstagram } from '@fortawesome/free-brands-svg-icons';
import { db } from './firebase';
import { doc, getDoc, updateDoc,} from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import './ProfilePage.css';

function UserProfilePage() {
  const { user } = useAuth();
  const { userId } = useParams();
  const [profile, setProfile] = useState({
    bio: '',
    profile_picture_url: '',
    social_links: '',
  });
  const [editMode, setEditMode] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setProfile(userDoc.data());
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
      if(isNewuser){
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
      }
      return null;
    });

  const handleEditProfile = () => {
    navigate(`/mypage/${userId}`);
  }
    
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
        <p>{profile.bio || '自己紹介がありません'}</p>
        <p>
          ソーシャルリンク: {profile.social_links ? renderSocialLinks(profile.social_links) : 'リンクがありません'}
        </p>
        {/* じぶんのページのとき (userId が一致する) ときのみ操作ボタンを表示する */}
        {user && user.uid == userId ? (
          <div>
            <button className="primary" onClick={() => setEditMode(true)}>プロフィール編集</button>
            <button className="primary" onClick={handleEditProfile}>マイページへ</button>
          </div>
        ) : (
          <div><span>(Other's card or not signed in)</span></div>
        )
        }
      </div>

      <Modal isOpen={editMode} onClose={() => setEditMode(false)}>
        <div className="profile-edit-form">
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
            placeholder="ソーシャルリンクを入力（,で区切る）"
          />
          <div className="modal-actions">
            <button onClick={() => setEditMode(false)}>キャンセル</button>
            <button onClick={handleSave}>保存</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default UserProfilePage;
