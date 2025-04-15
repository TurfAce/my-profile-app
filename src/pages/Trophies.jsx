import React, { useState } from 'react';
import './Trophies.css';

const Trophies = ({ exchangeCount, backImageChangeCount }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const TrophyModal = ({ trophies, onClose }) => {
    return (
      <div className="trophy-modal-overlay">
        <div className="trophy-modal">
          <h2>Trophy Grade</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
          <div className="trophy-list">
            {trophies.map((trophy, index) => (
              <div key={index} className="trophy-item">
                <img src={trophy.imageUrl} alt={`${trophy.level} Trophy`} />
                <p>{trophy.type === 'exchange' ? `現在の交換回数: ${exchangeCount}` : `裏面画像変更回数: ${backImageChangeCount}`}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // トロフィーのランク判定
  const getTrophyLevel = (count) => {
    if (count >= 10) return 'Gold';
    if (count >= 5) return 'Silver';
    if (count >= 1) return 'Bronze';
    return 'None';
  };

  // 進捗率の計算
  const getProgress = (count) => {
    if (count >= 10) return 100;
    if (count >= 5) return (count / 10) * 100;
    if (count >= 1) return (count / 10) * 100;
    return 0;
  };

  const exchangeTrophyLevel = getTrophyLevel(exchangeCount);
  const exchangeProgress = getProgress(exchangeCount);

  const backImageTrophyLevel = getTrophyLevel(backImageChangeCount);
  const backImageProgress = getProgress(backImageChangeCount);

  // トロフィー画像のURLを指定
  const trophyImages = {
    Gold: 'https://example.com/path/to/Gold.png',
    Silver: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgoUvWNgWK2_LgvaZfRpBwPeK6usqUAs1Q6vke68K1TSr4S-DkVkbkTqAPyUhqX4sUAQXBERKnn15I5XAnKvLToq1qNw4xzJaAj_xIYxUbN5GWWF39WgdOqYDoTgTblLWK4C1JO71CIDfM/s800/undoukai_trophy_silver.png',
    Bronze: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiugvcOJnxKNhObqup7u4K1iSvQXDlxkE1czf55R5Njio9v6pteRUmzrc42VwqR0_M37v1c9VdHekUUA19SDld2Nc6TiaNAyz2QH4qzA8ykmMG_S6qtRqHpwfbaNwBovKzTx6-YwcYPKHc/s800/undoukai_trophy_bronze.png',
  };

  // 所持するトロフィーリスト
  const trophies = [];
  ['Gold', 'Silver', 'Bronze'].forEach((level) => {
    if (getTrophyLevel(exchangeCount) === level) {
      trophies.push({ level, imageUrl: trophyImages[level], type: 'exchange' });
    }
    if (getTrophyLevel(backImageChangeCount) === level) {
      trophies.push({ level, imageUrl: trophyImages[level], type: 'backImage' });
    }
  });

  // マーカーの位置とラベル
  const markers = [
    { label: '5', value: 5 },
    { label: '10', value: 10 },
  ];

  return (
    <div className="trophies-container">
      <h2>実績</h2>
      <p>交換回数: {exchangeCount}</p>
      <div className="progress-bar-container">
        {/* 進捗バー */}
        <div className="progress-bar" style={{ width: `${exchangeProgress}%` }}></div>

        {/* マーカー */}
        {markers.map((marker) => (
          <div
            key={marker.value}
            className="progress-marker"
            style={{ left: `${(marker.value / 10) * 100}%` }}
          >
            {marker.label}
          </div>
        ))}
      </div>

      <p>裏面画像変更回数: {backImageChangeCount}</p>
      <div className="progress-bar-container">
        {/* 進捗バー */}
        <div className="progress-bar" style={{ width: `${backImageProgress}%` }}></div>

        {/* マーカー */}
        {markers.map((marker) => (
          <div
            key={marker.value}
            className="progress-marker"
            style={{ left: `${(marker.value / 10) * 100}%` }}
          >
            {marker.label}
          </div>
        ))}
      </div>

      <button className="view-trophies-button" onClick={() => setIsModalOpen(true)}>
        トロフィーを確認
      </button>

      {isModalOpen && (
        <TrophyModal trophies={trophies} onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
};

export default Trophies;