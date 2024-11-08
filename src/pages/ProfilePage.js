import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './ProfilePage.css';

function UserProfilePage() {
  const { userId } = useParams();
  const [profile, setProfile] = useState({
    bio: '',
    profile_picture_url: '',
    social_links: ''
  });
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    // Fetch user profile data
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
    fetch(`http://localhost:5000/login/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profile),
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
          setProfile(profile);
          setEditMode(false);
        }
      })
      .catch((error) => console.error('Error during fetch:', error));
  };

  return (
    <div className="profile-container">
      <h2>プロフィール</h2>
      {editMode ? (
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
            placeholder="ソーシャルリンクを入力"
          />
          <button onClick={handleSave}>保存</button>
          <button onClick={() => setEditMode(false)}>キャンセル</button>
        </div>
      ) : (
        <div className="profile-card">
          {profile.profile_picture_url ? (
            <img src={profile.profile_picture_url} alt="Profile" />
          ) : (
            <p>プロフィール画像がありません</p>
          )}
          <p>{profile.bio || '自己紹介がありません'}</p>
          <p>ソーシャルリンク: {profile.social_links || 'リンクがありません'}</p>
          <button className="primary" onClick={() => setEditMode(true)}>プロフィール編集</button>
        </div>
      )}
    </div>
  );
}

export default UserProfilePage;
