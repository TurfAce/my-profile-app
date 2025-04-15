import React, { useState } from 'react';
import './TutorialPage.css'; // Import the CSS file

const TutorialPage = () => {
  const [step, setStep] = useState(1);
  const [subStep, setSubstep] = useState(1);

  const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const nextSubStep = () => setSubstep(prev => Math.min(prev + 1, 3))
  const prevSubStep = () => setSubstep(prev => Math.max(prev - 1, 1))

  return (
    <div className="tutorial-page">
      <h1>アプリケーションの使い方</h1>

      {step === 1 && (
        <section className="tutorial-step">
          <h2>基本機能</h2>
          <div className="tutorial-content">
            <ul>
              <li>プロフィールを作成して、自己紹介やSNSアカウントリンクを入れた名刺をシェアしよう!</li>
              <li>毎日一度だけ更新できる写真を更新したり、たくさん名刺を集めてトロフィーをゲットしよう!</li>
            </ul>
            {/* <img src="/dad.jpg" className="profile-img" alt="アカウント作成のスクリーンショット" />
            <img src="/eae.jpg" className="profile-img" alt="アカウント作成のスクリーンショット" /> */}
          </div>
        </section>
      )}
      
      {step === 2 && (
        <section className="tutorial-step">
          <h2>交換の仕方</h2>
          <div className="tutorial-content">
            {subStep === 1 && (
              <>
                <p>左上のカメラアイコンでQRを読み込む</p>
                <img src="/aba1.jpeg" className="profile-img" alt="QR読み込みのスクリーンショット" />
              </>
            )}
            {subStep === 2 && (
              <>
                <p>自分のQRを読み込んでもらう</p>
                <img src="/aba2.jpeg" className="profile-img" alt="QR読み込みのスクリーンショット" />
              </>
            )}
            {subStep === 3 && (
              <>
                <p>Meisiを交換しよう!</p>
                <img src="/aba3.jpeg" className="profile-img" alt="名刺交換のスクリーンショット" />
              </>
            )}
            <div className="nav-buttons">
              <button onClick={prevSubStep} disabled={subStep === 1}>戻る</button>
              <button onClick={nextSubStep} disabled={subStep === 3}>次へ</button>
            </div>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="tutorial-step">
          <h2>1/1ストーリー</h2>
          <p>1日1回更新できる日記機能で今日のお気に入り場面を投稿しよう!</p>
          <img src="/cac.jpeg" alt="ダッシュボードのスクリーンショット" />
        </section>
      )}

      {step === 4 && (
        <section className="tutorial-step">
          <h2>実績</h2>
          <p>交換したり、写真を投稿してトロフィーを集めよう！</p>
          <img src="/bab.jpeg" alt="機能のスクリーンショット" />
        </section>
      )}

      <div className="nav-buttons">
        <button onClick={prevStep} disabled={step === 1}>戻る</button>
        <button onClick={nextStep} disabled={step === 4}>次へ</button>
      </div>
    </div>
  );
};

export default TutorialPage;