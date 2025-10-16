import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Api from '../../../service/Api';
import Security from '../../../service/Securite';
import HeaderApp from '../../header/HeaderApp';

const getBarColor = (percent) => {
  if (percent >= 75) return '#10b981';
  if (percent >= 40) return '#f59e0b';
  return '#ef4444';
};

const UserTableRow = ({ user, teamId, isSelected, onSelect }) => {
  const [anxietyData, setAnxietyData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnxietyData = async () => {
      try {
        const token = Security.getToken();
        const response = await Api.getUserData(teamId, user.id, 'per', token);
        
        if (response && Array.isArray(response) && response.length > 0) {
          const latest = response[response.length - 1];
          
          // Данные приходят в поле value (как в вашем примере)
          const anxietyValue = typeof latest.value === 'number' ? latest.value : 0;
          const updatedDate = latest.time ? new Date(latest.time) : new Date();
          
          setAnxietyData({
            anxiety: anxietyValue,
            updated: updatedDate
          });
        } else {
          // Если нет данных
          setAnxietyData({
            anxiety: 0,
            updated: new Date()
          });
        }
      } catch (error) {
        console.error('Error fetching anxiety data:', error);
        setAnxietyData({
          anxiety: 0,
          updated: new Date()
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnxietyData();
  }, [teamId, user.id]);

  if (loading) {
    return (
      <tr>
        <td style={{ padding: '1rem', textAlign: 'center' }}>
          <input 
            type="checkbox" 
            checked={isSelected} 
            onChange={(e) => onSelect(user.id, e.target.checked)}
            disabled
          />
        </td>
        <td style={{ padding: '1rem' }}>{user.email.split('@')[0]}</td>
        <td colSpan="3" style={{ textAlign: 'center', padding: '1rem' }}>
          Загрузка данных...
        </td>
      </tr>
    );
  }

  const formattedDate = anxietyData?.updated?.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const formattedTime = anxietyData?.updated?.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <tr style={{ borderBottom: '1px solid #d1d5db' }}>
      <td style={{ padding: '1rem', textAlign: 'center' }}>
        <input 
          type="checkbox" 
          checked={isSelected} 
          onChange={(e) => onSelect(user.id, e.target.checked)}
          style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
        />
      </td>
      <td style={{ padding: '1rem' }}>{user.email.split('@')[0]}</td>
      <td style={{ padding: '1rem' }}>
        <div style={{
          backgroundColor: '#f3f4f6',
          borderRadius: '4px',
          overflow: 'hidden',
          height: '1rem',
          width: '100%'
        }}>
          <div style={{
            height: '100%',
            backgroundColor: getBarColor(anxietyData?.anxiety || 0),
            textAlign: 'right',
            paddingRight: '0.5rem',
            lineHeight: '1rem',
            color: 'white',
            whiteSpace: 'nowrap',
            fontSize: '1rem',
            width: `${anxietyData?.anxiety || 0}%`
          }}>
            {anxietyData?.anxiety || 'N/A'}%
          </div>
        </div>
      </td>
      <td style={{ padding: '1rem' }}>
        {anxietyData?.updated ? `${formattedDate}, ${formattedTime}` : 'Н/Д'}
      </td>
      <td style={{ padding: '1rem' }}>
        <Link to={`/${teamId}/${user.id}`} style={{
          textDecoration: 'none',
          color: '#3b82f6',
          fontWeight: 'bold',
          transition: 'color 0.3s'
        }}>
          Открыть
        </Link>
      </td>
    </tr>
  );
};

const UserTable = ({ users, teamId, selectedUsers, onUserSelect }) => (
  <div style={{
    overflowX: 'auto',
    marginBottom: '1.5rem',
    boxShadow: '0px 0px 100px #3b83f628'
  }}>
    <table style={{
      width: '100%',
      borderCollapse: 'collapse',
      backgroundColor: 'white',
      borderRadius: '12px',
      overflow: 'hidden',
      minWidth: '700px',
      boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
    }}>
      <thead style={{ 
        backgroundColor: '#3b82f6',
        color: 'white'
      }}>
        <tr>
          <th style={{ padding: '1rem', textAlign: 'center', width: '50px' }}>Выбор</th>
          <th style={{ padding: '1rem', textAlign: 'left' }}>Участник</th>
          <th style={{ padding: '1rem', textAlign: 'left' }}>Расслабленность</th>
          <th style={{ padding: '1rem', textAlign: 'left' }}>Последнее обновление</th>
          <th style={{ padding: '1rem', textAlign: 'left' }}>Детали</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user, index) => (
          <UserTableRow 
            key={user.id} 
            user={user} 
            teamId={teamId}
            isSelected={selectedUsers.includes(user.id)}
            onSelect={onUserSelect}
          />
        ))}
      </tbody>
    </table>
  </div>
);

const CoachDashboard = ({ teamId }) => {
  const [teamData, setTeamData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [avgRelax, setAvgRelax] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        const teamResponse = await Api.getTeamInfo(teamId, token);
        setTeamData(teamResponse);
        
        const users = teamResponse?.clients || [];
        const filtered = users.filter(u =>
          u.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        setFilteredUsers(filtered);
        setTotalUsers(filtered.length);
        
        // Расчет средней расслабленности
        let totalAnxiety = 0;
        let count = 0;
        
        for (const user of filtered) {
          const userData = await Api.getUserData(teamId, user.id, "per", token);
          if (userData && userData.length > 0) {
            const latest = userData[userData.length - 1];
            totalAnxiety += latest.value;
            count++;
          }
        }
        
        setAvgRelax(count > 0 ? Math.round(totalAnxiety / count) : 0);
        
      } catch (err) {
        console.error('Error fetching team data:', err);
        setError(err.message || 'Ошибка загрузки данных команды');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [teamId, searchQuery]);

  const handleUserSelect = (userId, isSelected) => {
    if (isSelected) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleCompare = () => {
    if (selectedUsers.length > 0) {
      // Перенаправляем на страницу сравнения
      navigate(`/compare/${teamId}?users=${selectedUsers.join(',')}`);
    }
  };

  const refreshData = () => {
    setSelectedUsers([]);
    window.location.reload();
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Загрузка данных команды...</div>;
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}>
        {error}
      </div>
    );
  }

  if (!teamData) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Данные команды не найдены</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск участника..."
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            backgroundColor: '#ffffff',
            fontSize: '1rem',
            flex: '1',
            minWidth: '200px'
          }}
        />
        <button 
          onClick={refreshData}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1.5rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '500',
            transition: 'background-color 0.3s'
          }}
        >
          Обновить
        </button>
        {selectedUsers.length > 0 && (
          <button 
            onClick={handleCompare}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'background-color 0.3s'
            }}
          >
            Сравнить выбранных ({selectedUsers.length})
          </button>
        )}
      </div>

      <div style={{
        backgroundColor: '#ffffff',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ fontSize: '1.4rem', fontWeight: '600', color: '#1e293b' }}>
          Команда: <span style={{ color: '#3b82f6', fontWeight: '700' }}>{teamData.name}</span>
        </div>
        <div style={{ fontSize: '1.4rem', fontWeight: '600', color: '#1e293b' }}>
          Средняя расслабленность: <span style={{ color: '#3b82f6', fontWeight: '700' }}>{avgRelax}%</span>
        </div>
        <div style={{ fontSize: '1.1rem', color: '#1e293b' }}>
          Участников: <span style={{ color: '#3b82f6', fontWeight: '700' }}>{totalUsers}</span>
        </div>
      </div>
      
      {selectedUsers.length > 0 && (
        <div style={{
          backgroundColor: '#dbeafe',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          border: '1px solid #3b82f6'
        }}>
          <strong>Выбрано для сравнения: {selectedUsers.length} пользователей</strong>
          <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#1e40af' }}>
            Выберите 2 или более пользователей и нажмите "Сравнить выбранных"
          </div>
        </div>
      )}
      
      <UserTable 
        users={filteredUsers} 
        teamId={teamId}
        selectedUsers={selectedUsers}
        onUserSelect={handleUserSelect}
      />
    </div>
  );
};

const DashboardLayout = () => {
  const [teamName, setTeamName] = useState('');
  const { teamId } = useParams();
  
  useEffect(() => {
    const fetchTeamName = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await Api.getTeamInfo(teamId, token);
        setTeamName(response?.name || `Команда ${teamId}`);
      } catch (error) {
        console.error('Error fetching team name:', error);
      }
    };

    fetchTeamName();
  }, [teamId]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <HeaderApp />
      <main style={{ 
        padding: '2rem',
        flex: 1,
        background: 'linear-gradient(to right, #3b83f60e, #8a5cf610)',
      }}>
        <CoachDashboard teamId={teamId} />
      </main>
    </div>
  );
};

export default DashboardLayout;