// import React, { useEffect, useState } from 'react';
// import { useParams } from 'react-router-dom';

// const ProfilePage = () => {
//   const { userId } = useParams();
//   const [profile, setProfile] = useState(null);

//   useEffect(() => {
//     const fetchProfile = async () => {
//       const response = await fetch(`http://localhost:5000/profile/${userId}`);
//       if (response.ok) {
//         const data = await response.json();
//         setProfile(data);
//       } else {
//         alert('Failed to fetch profile');
//       }
//     };

//     fetchProfile();
//   }, [userId]);

//   if (!profile) {
//     return <p>Loading...</p>;
//   }

//   return (
//     <div>
//       <h1>{profile.username}'s Profile</h1>
//       <p>Email: {profile.email}</p>
//     </div>
//   );
// };

// export default ProfilePage;



// UserProfilePage.js

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

function UserProfilePage() {
  const { userId } = useParams();
  const [profile, setProfile] = useState({
    bio: '', // 初期値として空文字を設定
    profile_picture_url: '', // 初期値として空文字を設定
    social_links: '' // 初期値として空文字を設定
  });
    const [editMode, setEditMode] = useState(false);

    // 関数の外で userId を使用しようとする
console.log(userId); // ここでエラー


    useEffect(() => {
        fetch(`http://localhost:5000/profile/${userId}`)
          .then((response) => {
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            return response.json();
          })
          .then((data) => {
            setProfile(data);
          })
          .catch((error) => console.error('Error fetching profile:', error));
      }, [userId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleSave = () => {
    // fetch(`http://localhost:5000/profile/${userId}`, {
    //   method: 'PUT',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(profile),
    // })
    // .then(response => response.json())
    // .then(data => {
    //   if (data.message === 'Profile updated successfully') {
    //     setEditMode(false);
    //   }
    // })
    // .catch(error => console.error('Error updating profile:', error));

    // fetch(`http://localhost:5000/profile/${userId}`, {
    //     method: 'PUT',
    //     headers: {
    //         'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify(profile),
    //     })
    //     .then((response) => {
    //         if (!response.ok) {
    //         throw new Error('Network response was not ok');
    //         }
    //         return response.json();
    //     })
    //     .then((data) => {
    //         if (data.error) {
    //         console.error('Error updating profile:', data.error);
    //         } else {
    //         console.log('Profile updated successfully:', data);
    //         setEditMode(false); // 編集モードを終了
    //         }
    //     })
    //     .catch((error) => console.error('Error updating profile:', error));
    // };

    console.log('aaa')

    fetch(`http://localhost:5000/login/${userId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
    })
    .then((response) => {
        console.log('responce', response);
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
            setEditMode(false); // 編集モードを終了
        }
    })
    .catch((error) => console.error('Error during fetch:', error));

}

  return (
    <div>
      <h2>プロフィール</h2>
      {editMode ? (
        <div>
        <input
        type="text"
        name="bio"
        value={profile.bio || ''} // 値が undefined の場合、空文字を設定
        onChange={handleInputChange}
        placeholder="自己紹介を入力"
        />
        <input
        type="text"
        name="profile_picture_url"
        value={profile.profile_picture_url || ''} // 値が undefined の場合、空文字を設定
        onChange={handleInputChange}
        placeholder="プロフィール画像のURLを入力"
        />
        <input
        type="text"
        name="social_links"
        value={profile.social_links || ''} // 値が undefined の場合、空文字を設定
        onChange={handleInputChange}
        placeholder="ソーシャルリンクを入力"
        />
          <button onClick={handleSave}>保存</button>
          <button onClick={() => setEditMode(false)}>キャンセル</button>
        </div>
      ) : (
        <div>
          <img src={profile.profile_picture_url} alt="Profile" />
          <p>{profile.bio}</p>
          <p>ソーシャルリンク: {profile.social_links}</p>
          <button onClick={() => setEditMode(true)}>プロフィール編集</button>
        </div>
      )}
    </div>
  );
}

export default UserProfilePage;

