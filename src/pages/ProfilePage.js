import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Modal from './Modal'; // モーダルコンポーネントをインポート
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faTwitter, faInstagram } from '@fortawesome/free-brands-svg-icons';
import './ProfilePage.css';

function UserProfilePage() {
  const { userId } = useParams();
  const [profile, setProfile] = useState({
    bio: '',
    profile_picture_url: '',
    social_links: ''
  });
  const [editMode, setEditMode] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false); // 画像読み込み状態

  useEffect(() => {
    fetch(`http://localhost:5000/login/${userId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data) => setProfile(data))
      .catch((error) => console.error('Error fetching profile:', error));
  }, [userId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleSave = () => {
    const profileToSave = {
      ...profile,
      social_links: profile.social_links  // 文字列のまま保存
    };
  
    fetch(`http://localhost:5000/login/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileToSave),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok: ' + response.statusText);
        }
        return response.json();
      })
      .then((data) => {
        if (data.error) {
          console.error('Error updating profile:', data.error);
        } else {
          console.log('Profile updated successfully:', data);
          setEditMode(false);
        }
      })
      .catch((error) => console.error('Error during fetch:', error));
  };
    
  // 画像が読み込まれたらフェードインさせるための関数
  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  // ソーシャルリンクに対応するアイコンを表示する関数
  const renderSocialLinks = (links) => {
    return links.split(',').map((link) => {
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
      return null; // 他のリンクの場合
    });
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
            onLoad={handleImageLoad} // 画像読み込み完了時にフェードイン
          />
        ) : (
          <p>プロフィール画像がありません</p>
        )}
        <p>{profile.bio || '自己紹介がありません'}</p>
        <p>ソーシャルリンク: {profile.social_links ? renderSocialLinks(profile.social_links) : 'リンクがありません'}</p>
        <button className="primary" onClick={() => setEditMode(true)}>プロフィール編集</button>
      </div>

      <Modal isOpen={editMode} onClose={() => setEditMode(false)}>
        <div className="profile-edit-form">
          <h2>プロフィールを編集</h2>
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
