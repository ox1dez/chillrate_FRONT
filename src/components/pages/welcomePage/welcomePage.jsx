import React from 'react';
import { Link } from 'react-router-dom';
import HeaderApp from '../../header/HeaderApp';
import BottomApp from '../../bottom/BottomApp';
import "./welcomePage.css"
const WelcomePage = () => {
  return (
    <div className='mainDivWelcome'>
      <HeaderApp></HeaderApp>
      <section className='bodyWelcome'>
        <h2 className='tittleWelcome'>
          Добро пожаловать в <span style={{ color: '#3b82f6' }}>ChillRate</span>
        </h2>
        <p className='textAboutWelcome'>
          Управляй командами, отслеживай расслабленность и повышай эффективность — всё в одном сервисе.
        </p>
        <Link to="/auth" className='linkAuthWelcome'
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6366f1'}
        >
          Начать работу
        </Link>
      </section>
      <section className='qualityListWelcome'>
        {[
          ['📈', 'Прозрачная статистика', 'Следи за прогрессом и принимай решения на основе данных.'],
          ['🤝', 'Сотрудничество в команде', 'Объединяйся, делись достижениями и поддерживай мотивацию.'],
          ['⚡', 'Мгновенные подключения', 'QR-коды позволяют подключать участников в один клик.'],
          ['🌿', 'Расслабленность под контролем', 'Следи за состоянием участников.']
        ].map(([icon, title, desc], i) => (
          <div key={i} className='qualityItem'>
            <div className='itemIcon'>{icon}</div>
            <h3 className='itemTittle'>{title}</h3>
            <p className='itemText'>{desc}</p>
          </div>
        ))}
      </section>
      <BottomApp></BottomApp>
    </div>
  );
};
export default WelcomePage;
