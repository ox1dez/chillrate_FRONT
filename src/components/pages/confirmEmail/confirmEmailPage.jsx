import React from 'react';
import { Link } from 'react-router-dom';
import BottomApp from '../../bottom/BottomApp';
import "./confirmEmailPage.css"
import HeaderApp from '../../header/HeaderApp';
const ConfirmEmailPage = () => {
  return (
    <div className='mainDivConfrirmEmail'>
      <HeaderApp></HeaderApp>
      <section className='kardConfirmEmail'>
        <div className='kardContainerConfirmEmail'>
          <div className='headContainerKardConfirmEmail'>
            <div className='imgContainerConfrimEmail'>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4H20C21.1046 4 22 4.89543 22 6V18C22 19.1046 21.1046 20 20 20H4C2.89543 20 2 19.1046 2 18V6C2 4.89543 2.89543 4 4 4Z" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 6L12 13L2 6" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className='confirmTittleCardConfirmEmail'>
              Подтвердите почту
            </h2>
            <p className='textContentConfirmEmail'>
              На указанный адрес электронной почты отправлена ссылка для подтверждения. Проверьте почту и перейдите по ней, чтобы активировать аккаунт.
            </p>
          </div>
          <div className='BottomCardConfirmEmail'>
            <Link to="/auth" className='linkToAuthConfirmEmail'
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6366f1'}
            >
              Вернуться к входу
            </Link>
            <div className='textBottomConfirmEmail'>
              Если письмо не пришло, проверь папку "Спам" или запроси повторную отправку.
            </div>
          </div>
        </div>
      </section>
      <BottomApp></BottomApp>
    </div>
  );
};

export default ConfirmEmailPage;
