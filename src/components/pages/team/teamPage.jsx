import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import Api from '../../../service/Api';
import Security from '../../../service/Securite';
import HeaderApp from '../../header/HeaderApp';

const getBarColor = (percent) => {
  if (percent >= 75) return '#10b981';
  if (percent >= 40) return '#f59e0b';
  return '#ef4444';
};

const UserTableRow = ({ user, teamId }) => {
  const [anxietyData, setAnxietyData] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchAnxietyData = async () => {
      try {
        const token = Security.getToken();
        const response = await Api.getUserData(teamId, user.id, token);
        
        if (response && Array.isArray(response) && response.length > 0) {
          const latest = response[response.length - 1];
          const anxiety = JSON.parse(latest.data).percentageAnxiety;
          const updated = new Date(latest.dateTime);
          
          setAnxietyData({
            anxiety,
            updated
          });
        }
      } catch (error) {
        console.error('Error fetching anxiety data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnxietyData();
  }, [teamId, user.email]);

  if (loading) {
    return (
      <tr>
        <td colSpan="5" style={{ textAlign: 'center', padding: '1rem' }}>
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

const UserTable = ({ users, teamId }) => (
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
      minWidth: '650px',
      boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
    }}>
      <thead style={{ 
        backgroundColor: '#3b82f6',
        color: 'white'
      }}>
        <tr>
          <th style={{ padding: '1rem', textAlign: 'left' }}>Участник</th>
          <th style={{ padding: '1rem', textAlign: 'left' }}>Расслабленность</th>
          <th style={{ padding: '1rem', textAlign: 'left' }}>Последнее обновление</th>
          <th style={{ padding: '1rem', textAlign: 'left' }}>Детали</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user, index) => (
          <UserTableRow key={index} user={user} teamId={teamId} />
        ))}
      </tbody>
    </table>
  </div>
);

const CoachDashboard = ({ teamId }) => {
  const [teamData, setTeamData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [avgRelax, setAvgRelax] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


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
        
        let totalAnxiety = 0;
        let count = 0;
        
        for (const user of filtered) {
          const userData = await Api.getUserData(teamId, user.id, "per", token);
          if (userData && userData.length > 0) {
            totalAnxiety += userData[userData.length - 1].value
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
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск участника..."
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            backgroundColor: '#fffffff',
            fontSize: '1rem'
          }}
        />
        <button 
          onClick={() => window.location.reload()}
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
      </div>

      <div style={{
        backgroundColor: '#ffffff',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '1.4rem', fontWeight: '600', color: '#1e293b' }}>
          Команда: <span style={{ color: '#3b82f6', fontWeight: '700' }}>{teamData.name}</span>
        </div>
        <div style={{ fontSize: '1.4rem', fontWeight: '600', color: '#1e293b' }}>
          Средняя расслабленность: <span style={{ color: '#3b82f6', fontWeight: '700' }}>{avgRelax}%</span>
        </div>
        <div>Участников: <span style={{ color: '#3b82f6', fontWeight: '700' }}>{totalUsers}</span></div>
      </div>
      
      <UserTable users={filteredUsers} teamId={teamId} />

    </div>
  );
};

const DashboardLayout = () => {
  const [teamName, setTeamName] = useState('');
  const {teamId} = useParams();
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
      <HeaderApp></HeaderApp>
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