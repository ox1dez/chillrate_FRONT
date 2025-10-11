import React, { useState } from 'react';
import logo from '../../../assets/logo.svg';
import Api from '../../../service/Api'; 
import { useNavigate } from 'react-router-dom';
import Security from '../../../service/Securite';
import  './auth.css'
const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState(''); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [working, setWorking] = useState(false);
  const [msg, setMsg] = useState(null);
  const navigate = useNavigate();
  const toggleAuth = () => {
    setIsLogin(!isLogin);
    setMsg(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    setWorking(true);

    try {
      let result;

      if (isLogin) {
        result = await Api.auth(name, email, password);
      } else {
        result = await Api.register(name, email, password);
      }

      if (result?.error) {
        setMsg(`Ошибка: ${typeof result.error === 'string' ? result.error : JSON.stringify(result.error)}`);
      } else if (result?.accessToken) {
        
        //localStorage.setItem('token', result.token);
        //localStorage.setItem('user', result.user);
        setMsg('Успешно!');
        if (isLogin) {
          Security.login(result.user,result.accessToken,isLogin);
          navigate('/main');
        } else {
          Security.login(result.user,result.accessToken,isLogin);
          navigate('/confirm');
        }
      } else {
        setMsg(JSON.stringify(result));
      }
    } catch (ex) {
      setMsg('ошибка запроса: ' + (ex.message || JSON.stringify(ex)));
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className='mainDivAuth'>
      <div className='kardAuth'>
        <div className='authLogoContainer'>
          <img src={logo} className='logoImgAuth' alt="logo" />
        </div>

        <h2 className='headCard'>
          {isLogin ? 'Вход в аккаунт' : 'Регистрация'}
        </h2>

        <form onSubmit={handleSubmit} className='formAuth'>
          {!isLogin && (
            <input
              type="text"
              placeholder="Имя"
              value={name}
              onChange={e => setName(e.target.value)}
              className='inputStyleAuth'
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className='inputStyleAuth'
            required
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className='inputStyleAuth'
            required
          />

          <button
            type="submit"
            className='buttonStyleAuth'
            style={{  opacity: working ? 0.7 : 1, pointerEvents: working ? 'none' : 'auto' }}
            disabled={working}
          >
            {working ? (isLogin ? 'Вход...' : 'Регистрация...') : (isLogin ? 'Войти' : 'Зарегистрироваться')}
          </button>
        </form>

        {msg && (
          <p style={{ marginTop: '1rem', color: msg.startsWith('Ошибка') ? '#b91c1c' : '#166534', fontSize: '0.9rem' }}>
            {msg}
          </p>
        )}

        <p className='bottomCardAuth'>
          {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
          <span onClick={toggleAuth} className='bottomCardContainerAuth'>
            {isLogin ? 'Зарегистрироваться' : 'Войти'}
          </span>
        </p>
      </div>
    </div>
  );
};


export default AuthPage;
