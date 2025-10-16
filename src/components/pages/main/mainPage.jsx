// CoachHomePage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import Api from '../../../service/Api.js'
import Security from '../../../service/Securite.js';
import HeaderApp from '../../header/HeaderApp.jsx';
import BottomApp from '../../bottom/BottomApp.jsx';


const CoachHomePage = () => {

  const [teams, setTeams] = useState([]);
  const uniqueUsers = new Set();
  teams.forEach(team => {
    team.clients.forEach(client => {
      uniqueUsers.add(client.id);
    });
  });
  const totalUsers = uniqueUsers.size;
  const teamsCount = teams.length;
  const token = Security.getToken();
  const [isAdding, setIsAdding] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [error, setError] = useState(null);
  const [requests, setRequests] = useState([]);
  const [urlAdmin,setUrlAdmin]=useState(null);
  const [copied,setCopied]=useState(false);
  // Состояние для хранения выбранных команд для каждого пользователя
  const [selectedTeams, setSelectedTeams] = useState(
    requests.reduce((acc, request) => {
      acc[request.email] = [];
      return acc;
    }, {})
  );
  const handleAddToTeam = async (userEmail, teamId) => {
    try {
      const response = await Api.acceptUser(teamId, userEmail, token);
      
      if (response.data) {
        setRequests(prev => prev.filter(request => request.id !== userEmail));
      } else {
        console.error('Ошибка при добавлении пользователя в команду');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddTeam = async () => {
    const trimmedName = newTeamName.trim();
    if (!trimmedName) {
      setError('Название команды не может быть пустым');
      return;
    }

    setError(null);
    setIsAdding(false);

    try {
      const response = await Api.createTeam(trimmedName, token);

      setNewTeamName('');

    } catch (error) {
      setError(error.response?.data?.message || 
               error.message || 
               'Неизвестная ошибка при создании команды');
      setIsAdding(true);
    }
};
useEffect(()=>{
  const load=async()=>{
    setUrlAdmin(await Api.getAdminUrl(token));
  }
  load();
})
useEffect(() => {
    const fetchData = async () => {
      setLoadingTeams(true);
      setError(null);
      if (!token) {
        setError('Не авторизован');
        setLoadingTeams(false);
        return;
      }

      try {
        const [teamsRes, waitUsersRes] = await Promise.all([
          Api.getTeams(token),
          Api.getWaitUsers(token),
        ]);

        if (teamsRes?.error) {
          setError((prev) => prev ? prev + '; ' + teamsRes.error : teamsRes.error);
        } else if (Array.isArray(teamsRes)) {
          setTeams(teamsRes);
        } else {
          console.warn('Непредвиденный формат ответа getTeams:', teamsRes);
        }

        if (waitUsersRes?.error) {
          setError((prev) => prev ? prev + '; ' + waitUsersRes.error : waitUsersRes.error);
        } else {
          setRequests(waitUsersRes);
        }
      } catch (ex) {
        setError(ex.message || 'Ошибка при загрузке данных');
      } finally {
        setLoadingTeams(false);
      }
    };

    fetchData();
  }, [token, teams, requests]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Inter', sans-serif",
      background: 'linear-gradient(to right, #3b83f60e, #8a5cf610)',
    }}>
      {/* Верхняя панель */}
      <HeaderApp></HeaderApp>
      <main style={{
        flex: 1,
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        padding: '2rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
        boxSizing: 'border-box'
      }}>
        {error && <><span>{error}</span></>}
        <section style={{
          backgroundColor: 'white',
          padding: '1.75rem',
          borderRadius: '16px',
          boxShadow: '0 8px 24px rgba(149, 157, 165, 0.15)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          border: '1px solid #f0f2f5',
          ':hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 12px 28px rgba(149, 157, 165, 0.2)'
          }
        }}>
          <h2 style={{
            marginBottom: '1.5rem',
            fontWeight: 600,
            fontSize: '1.5rem',
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{
              display: 'inline-block',
              width: '6px',
              height: '24px',
              backgroundColor: '#3b82f6',
              borderRadius: '3px'
            }}></span>
            Мои команды
          </h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {teams.map((team) => (
              <li key={team.id} style={{ marginBottom: '0.75rem' }}>
                <Link to={`/team/${team.id}`} style={{
                  display: 'block',
                  padding: '0.9rem 1.25rem',
                  backgroundColor: '#f8fafc',
                  color: '#1e40af',
                  fontWeight: 500,
                  borderRadius: '12px',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  borderLeft: '3px solid #3b82f6',
                  ':hover': {
                    backgroundColor: '#eff6ff',
                    transform: 'translateX(4px)'
                  }
                }}>
                  {team.name}
                </Link>
              </li>
            ))}
            <li>
            {isAdding ? (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              <input
                type="text"
                placeholder="Название команды"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                style={{
                  flexGrow: 1,
                  padding: '0.9rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid #d1d5db',
                  fontSize: '0.75rem'
                }}
              />
              <button
                onClick={handleAddTeam}
                style={{
                  padding: '0.9rem 1.25rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  fontWeight: 500,
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Создать
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              style={{
                width: '100%',
                padding: '0.9rem 1.25rem',
                backgroundColor: '#036aa11f',
                color: '#0369a1',
                fontWeight: 500,
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                borderLeft: '3px solid #0ea5e9'
              }}
            >
              ➕ Добавить команду
            </button>
          )}
          </li>
          </ul>
        </section>

        <section style={{
          backgroundColor: 'white',
          padding: '1.75rem',
          borderRadius: '16px',
          boxShadow: '0 8px 24px rgba(149, 157, 165, 0.15)',
          border: '1px solid #f0f2f5'
        }}>
          <h2 style={{
            marginBottom: '1.5rem',
            fontWeight: 600,
            fontSize: '1.5rem',
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{
              display: 'inline-block',
              width: '6px',
              height: '24px',
              backgroundColor: '#10b981',
              borderRadius: '3px'
            }}></span>
            Общая статистика
          </h2>
          
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{
              backgroundColor: '#f0fdf9',
              padding: '1.25rem',
              borderRadius: '12px',
              flex: 1,
              minWidth: '150px'
            }}>
              <div style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Участников</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0f766e' }}>{totalUsers}</div>
            </div>
            
            <div style={{
              backgroundColor: '#f0f9ff',
              padding: '1.25rem',
              borderRadius: '12px',
              flex: 1,
              minWidth: '150px'
            }}>
              <div style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Команд</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0c4a6e' }}>{teamsCount}</div>
            </div>
          </div>
          
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            
  
          </div>
        </section>

        <section style={{
          backgroundColor: 'white',
          padding: '1.75rem',
          borderRadius: '16px',
          boxShadow: '0 8px 24px rgba(149, 157, 165, 0.15)',
          border: '1px solid #f0f2f5',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h2 style={{
            marginBottom: '1.5rem',
            fontWeight: 600,
            fontSize: '1.5rem',
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{
              display: 'inline-block',
              width: '6px',
              height: '24px',
              backgroundColor: '#8b5cf6',
              borderRadius: '3px'
            }}></span>
            Приглашение в команду
          </h2>
          
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '1.5rem',
            backgroundColor: '#f5f3ff',
            borderRadius: '16px'
          }}>
            {/* <div style={{
              width: '180px',
              height: '180px',
              backgroundColor: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.1)',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                width: '140px',
                height: '140px',
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '4px'
              }}>
                {[...Array(25)].map((_, i) => (
                  <div key={i} style={{
                    backgroundColor: i % 4 === 0 ? '#8b5cf6' : '#ede9fe',
                    borderRadius: '3px'
                  }}></div>
                ))}
              </div>
            </div> */}
            <QRCodeSVG value={urlAdmin} />

            <h3 style={{ fontWeight: 600, color: '#5b21b6', marginBottom: '0.5rem' }}>Сканируйте QR-код</h3>
            <p style={{ color: '#64748b', lineHeight: 1.5 }}>
              Отсканируйте код для присоединения к команде через мобильное устройство
            </p>
          </div>
          
          <button style={{
            marginTop: '1.5rem',
            padding: '0.9rem',
            backgroundColor: '#ede9fe',
            border: 'none',
            borderRadius: '12px',
            color: '#7c3aed',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            ':hover': {
              backgroundColor: '#ddd6fe'
            }
          }}
          onClick={(e)=>{
          navigator.clipboard.writeText(urlAdmin);
          setCopied(true);
          }}>
           {copied?"Скопировано":" Поделиться QR-кодом"}
          </button>
        </section>
        
        {/* Новая секция: заявки */}
      <section style={{
          backgroundColor: 'white',
          padding: '1.75rem',
          borderRadius: '16px',
          boxShadow: '0 8px 24px rgba(149, 157, 165, 0.15)',
          border: '1px solid #f0f2f5',
          gridColumn: '1 / -1'
        }}>
          <h2 style={{
            marginBottom: '1.5rem',
            fontWeight: 600,
            fontSize: '1.5rem',
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{
              display: 'inline-block',
              width: '6px',
              height: '24px',
              backgroundColor: '#f59e0b',
              borderRadius: '3px'
            }}></span>
            Заявки на вступление
          </h2>

          {requests.length === 0 ? (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: '#64748b',
              backgroundColor: '#f8fafc',
              borderRadius: '12px'
            }}>
              Нет новых заявок на вступление
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {requests.map(request => (
                <div key={request.email} style={{
                  padding: '1.25rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{request.name}</div>
                      <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{request.email}</div>
                    </div>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    gap: '1rem',
                    flexWrap: 'wrap'
                  }}>
                    {teams.map(team => (
                      <button
                        key={team.id}
                        onClick={() => handleAddToTeam(request.id, team.id)}
                        style={{
                          padding: '0.6rem 1rem',
                          backgroundColor: '#e0f2fe',
                          color: '#0369a1',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          ':hover': {
                            backgroundColor: '#bae6fd'
                          }
                        }}
                      >
                        Добавить в {team.name}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => handleRejectRequest(request.id)}
                      style={{
                        padding: '0.6rem 1rem',
                        backgroundColor: '#fee2e2',
                        color: '#b91c1c',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        ':hover': {
                          backgroundColor: '#fecaca'
                        }
                      }}
                    >
                      Отклонить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        
      </main>
      <BottomApp></BottomApp>
    </div>
  );
};

export default CoachHomePage;