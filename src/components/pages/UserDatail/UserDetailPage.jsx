import { useParams, Link } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import Api from '../../../service/Api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, Brush, Legend, ReferenceLine
} from 'recharts';
import HeaderApp from '../../header/HeaderApp';

const findNearestIndexByDate = (data, targetDate) => {
  if (!data || data.length === 0) return -1;
  let bestIdx = 0;
  let bestDiff = Math.abs(data[0].fullDate - targetDate);
  for (let i = 1; i < data.length; i++) {
    const diff = Math.abs(data[i].fullDate - targetDate);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i;
    }
  }
  return bestIdx;
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;
  return (
    <div style={{ background: '#fff', padding: 8, borderRadius: 6, boxShadow: '0 4px 18px rgba(2,6,23,0.08)' }}>
      <div style={{ fontSize: 12, color: '#475569' }}>{point.date} {point.time}</div>
      <div style={{ fontWeight: 700 }}>{`Расслабленность: ${point.anxiety}%`}</div>
      <div style={{ fontSize: 12, color: '#64748b' }}>{`#${point.index}`}</div>
    </div>
  );
};

const buttonStyle = {
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid #cbd5e1',
  background: 'white',
  cursor: 'pointer',
  fontSize: 14
};

// Функция для форматирования данных
const formatChartData = (response) => {
  if (!response || !Array.isArray(response)) return [];

  return response.map((item, idx) => {
    const date = item?.time ? new Date(item.time) : null;
    if (!date || isNaN(date.getTime())) return null;

    const anxietyValue = typeof item.value === 'number' ? item.value : Number(item.value) || 0;

    return {
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: date.toLocaleDateString(),
      anxiety: anxietyValue,
      fullDate: date,
      index: idx,
      uuid: item.uuid,
      sensorType: item.sensorType
    };
  }).filter(Boolean).sort((a, b) => a.fullDate - b.fullDate);
};

// Функция для получения имени пользователя по ID
const getUserName = (teamInfo, userId) => {
  if (!teamInfo || !teamInfo.clients) return userId;
  
  const user = teamInfo.clients.find(client => client.id === userId);
  if (user) {
    // Возвращаем имя, если оно есть, иначе email без домена, иначе ID
    return user.name || user.email?.split('@')[0] || userId;
  }
  
  return userId;
};

export default function UserDetailPage() {
  const { teamId, userId } = useParams();
  const token = localStorage.getItem('token');
  const [userName, setUserName] = useState(userId); // Начальное значение - ID
  const [teamInfo, setTeamInfo] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentAnxiety, setCurrentAnxiety] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const [showLast, setShowLast] = useState(50);
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(0);

  const [hoverIndex, setHoverIndex] = useState(null);
  const [lockedIndex, setLockedIndex] = useState(null);
  const [samplingStep, setSamplingStep] = useState(1);
  const [dotsVisible, setDotsVisible] = useState(false);

  const chartRef = useRef(null);
  const lastDataUUID = useRef(''); // Для отслеживания изменений по последнему UUID

  // Функция загрузки информации о команде для получения имени пользователя
  const fetchTeamInfo = useCallback(async () => {
    try {
      const response = await Api.getTeamInfo(teamId, token);
      
      if (response instanceof Error) {
        throw new Error(`API Error: ${response.message}`);
      }
      
      setTeamInfo(response);
      
      // Устанавливаем имя пользователя
      const name = getUserName(response, userId);
      setUserName(name);
      
      return response;
    } catch (e) {
      console.error('Error fetching team info:', e);
      // В случае ошибки оставляем userId как есть
      return null;
    }
  }, [teamId, userId, token]);

  // Функция загрузки данных с оптимизацией
  const fetchUserData = useCallback(async () => {
    try {
      const response = await Api.getUserData(teamId, userId, 'per', token);
      
      if (response instanceof Error) {
        throw new Error(`API Error: ${response.message}`);
      }
      
      if (!response || !Array.isArray(response)) {
        throw new Error('Некорректный формат данных');
      }

      const formattedData = formatChartData(response);
      
      // Проверяем, изменились ли данные (по последнему UUID)
      const latestUUID = formattedData.length > 0 ? formattedData[formattedData.length - 1].uuid : '';
      const hasNewData = latestUUID !== lastDataUUID.current;
      
      if (hasNewData) {
        lastDataUUID.current = latestUUID;
      }

      return { data: formattedData, changed: hasNewData };
    } catch (e) {
      console.error('Error fetching user data:', e);
      throw e;
    }
  }, [teamId, userId, token]);

  // Основной эффект для первоначальной загрузки
  useEffect(() => {
    let mounted = true;

    const loadInitialData = async () => {
      try {
        setError(null);
        setLoading(true);

        // Загружаем информацию о команде для получения имени
        await fetchTeamInfo();
        
        // Загружаем данные графика
        const result = await fetchUserData();
        
        if (!mounted) return;

        setChartData(result.data);
        
        if (result.data.length > 0) {
          const lastPoint = result.data[result.data.length - 1];
          setCurrentAnxiety(lastPoint.anxiety);
          setLastUpdate(lastPoint.fullDate);
        }

        setLoading(false);

      } catch (e) {
        console.error('Initial load error:', e);
        if (mounted) {
          setError(e.message || 'Ошибка загрузки данных');
          setLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      mounted = false;
    };
  }, [fetchTeamInfo, fetchUserData]);

  // Эффект для периодического обновления ТОЛЬКО графика
  useEffect(() => {
    let mounted = true;
    let intervalId = null;

    const setupPeriodicUpdate = () => {
      intervalId = setInterval(async () => {
        if (!mounted) return;
        
        try {
          const result = await fetchUserData();
          if (!mounted) return;

          // Обновляем ТОЛЬКО если данные изменились
          if (result.changed) {
            // Используем функциональное обновление для минимального ререндера
            setChartData(prevData => {
              const newData = result.data;
              
              // Автоматически расширяем видимую область если смотрим на последние данные
              if (newData.length > prevData.length && endIndex >= prevData.length - 1) {
                setEndIndex(newData.length - 1);
              }
              
              return newData;
            });

            // Обновляем текущие значения
            if (result.data.length > 0) {
              const lastPoint = result.data[result.data.length - 1];
              setCurrentAnxiety(lastPoint.anxiety);
              setLastUpdate(lastPoint.fullDate);
            }
          }
        } catch (e) {
          console.error('Periodic update error:', e);
          // Не прерываем обновление при ошибках
        }
      }, 5000); // Обновление каждые 5 секунд
    };

    // Запускаем обновление только после успешной загрузки
    if (!loading && !error) {
      const timeoutId = setTimeout(setupPeriodicUpdate, 1000);
      
      return () => {
        mounted = false;
        clearTimeout(timeoutId);
        if (intervalId) clearInterval(intervalId);
      };
    }

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [loading, error, fetchUserData, endIndex]);

  // Эффект для обновления индексов отображения
  useEffect(() => {
    const len = chartData.length;
    if (len === 0) {
      setStartIndex(0);
      setEndIndex(0);
      return;
    }
    
    if (showLast === 'all' || showLast >= len) {
      setStartIndex(0);
      setEndIndex(len - 1);
    } else {
      const s = Math.max(0, len - Number(showLast));
      setStartIndex(s);
      setEndIndex(len - 1);
    }
  }, [chartData, showLast]);

  // Оптимизированная функция для получения видимых данных
  const getVisibleData = useCallback(() => {
    if (!chartData || chartData.length === 0) return [];
    const slice = chartData.slice(startIndex, endIndex + 1);
    if (samplingStep <= 1) return slice;

    return slice.filter((p, i) => {
      const absIdx = startIndex + i;
      return ((absIdx - startIndex) % samplingStep === 0) || (lockedIndex !== null && absIdx === lockedIndex);
    });
  }, [chartData, startIndex, endIndex, samplingStep, lockedIndex]);

  const visibleData = getVisibleData();

  // Остальные функции без изменений...
  const zoomIn = () => {
    const len = Math.max(1, endIndex - startIndex + 1);
    const newLen = Math.max(1, Math.floor(len / 2));
    const newStart = Math.max(0, endIndex - newLen + 1);
    setStartIndex(newStart);
    setEndIndex(newStart + newLen - 1);
  };

  const zoomOut = () => {
    const len = Math.max(1, endIndex - startIndex + 1);
    const newLen = Math.min(chartData.length, len * 2);
    const newStart = Math.max(0, endIndex - newLen + 1);
    setStartIndex(newStart);
    setEndIndex(Math.min(newStart + newLen - 1, chartData.length - 1));
  };

  const panLeft = () => {
    const len = Math.max(1, endIndex - startIndex + 1);
    const shift = Math.max(1, Math.floor(len / 3));
    const newStart = Math.max(0, startIndex - shift);
    setStartIndex(newStart);
    setEndIndex(Math.min(newStart + len - 1, chartData.length - 1));
  };

  const panRight = () => {
    const len = Math.max(1, endIndex - startIndex + 1);
    const shift = Math.max(1, Math.floor(len / 3));
    const newEnd = Math.min(chartData.length - 1, endIndex + shift);
    setStartIndex(Math.max(0, newEnd - len + 1));
    setEndIndex(newEnd);
  };

  const fitAll = () => {
    setStartIndex(0);
    setEndIndex(chartData.length - 1);
  };

  const handleChartMouseMove = (state) => {
    if (!state || state.isTooltipActive === false) return;
    const relative = state.activeTooltipIndex;
    if (typeof relative === 'number' && !isNaN(relative)) {
      const absolute = startIndex + relative;
      setHoverIndex(absolute);
      if (!lockedIndex) {
        const p = chartData[absolute];
        if (p) {
          setCurrentAnxiety(p.anxiety);
          setLastUpdate(p.fullDate);
        }
      }
    }
  };

  const handleChartMouseLeave = () => {
    setHoverIndex(null);
    if (!lockedIndex && chartData.length > 0) {
      const last = chartData[chartData.length - 1];
      setCurrentAnxiety(last.anxiety);
      setLastUpdate(last.fullDate);
    }
  };

  const handleChartClick = () => {
    if (hoverIndex === null) return;
    setLockedIndex(prev => (prev === hoverIndex ? null : hoverIndex));
  };

  useEffect(() => {
    const handler = (e) => {
      if (lockedIndex === null) return;
      if (e.key === 'ArrowLeft') setLockedIndex(i => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setLockedIndex(i => Math.min(chartData.length - 1, i + 1));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lockedIndex, chartData.length]);

  const jumpToDate = (isoString) => {
    if (!isoString) return;
    const target = new Date(isoString);
    if (isNaN(target.getTime()) || chartData.length === 0) return;
    const nearest = findNearestIndexByDate(chartData, target);

    const windowSize = Math.min(chartData.length, Math.max(5, Math.floor((endIndex - startIndex + 1) || 50)));
    const half = Math.floor(windowSize / 2);
    const newStart = Math.max(0, nearest - half);
    const newEnd = Math.min(chartData.length - 1, newStart + windowSize - 1);

    setStartIndex(newStart);
    setEndIndex(newEnd);
    setLockedIndex(nearest);
  };

  const exportCSV = (onlyVisible = false) => {
    const rows = (onlyVisible ? visibleData : chartData).map(p => ({ 
      index: p.index, 
      date: p.fullDate.toISOString(), 
      anxiety: p.anxiety,
      uuid: p.uuid 
    }));
    const header = ['index,date,anxiety,uuid'];
    const lines = rows.map(r => `${r.index},${r.date},${r.anxiety},${r.uuid}`);
    const csv = header.concat(lines).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anxiety_${userName || 'user'}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div style={{ padding: 40, color: '#64748b' }}>Загрузка данных...</div>;
  if (error) return <div style={{ padding: 40, color: 'crimson' }}>Ошибка: {error}</div>;

  const highlightedPoint = (lockedIndex !== null && chartData[lockedIndex])
    || (hoverIndex !== null && chartData[hoverIndex])
    || null;

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'Inter, Arial, sans-serif', background: 'linear-gradient(to right, #3b83f60e, #8a5cf610)', }}>
      <HeaderApp />
      <main style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ marginBottom: 8 }}>Пользователь: {userName}</h1>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <div style={{ padding: 12, background: '#fff', borderRadius: 8, boxShadow: '0 6px 20px rgba(2,6,23,0.04)' }}>
            <div style={{ color: '#64748b', fontSize: 12 }}>Текущий уровень расслабленности</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{currentAnxiety !== null ? `${currentAnxiety}%` : '—'}</div>
          </div>
          <div style={{ padding: 12, background: '#fff', borderRadius: 8, boxShadow: '0 6px 20px rgba(2,6,23,0.04)' }}>
            <div style={{ color: '#64748b', fontSize: 12 }}>Последнее обновление</div>
            <div>{lastUpdate ? lastUpdate.toLocaleString('ru-RU') : '—'}</div>
          </div>
          <div style={{ padding: 12, background: '#fff', borderRadius: 8, boxShadow: '0 6px 20px rgba(2,6,23,0.04)' }}>
            <div style={{ color: '#64748b', fontSize: 12 }}>Зафиксированная точка</div>
            <div>{highlightedPoint ? `${highlightedPoint.date} ${highlightedPoint.time} — ${highlightedPoint.anxiety}% (#${highlightedPoint.index})` : 'не выбрана'}</div>
          </div>
          <div style={{ padding: 12, background: '#fff', borderRadius: 8, boxShadow: '0 6px 20px rgba(2,6,23,0.04)' }}>
            <div style={{ color: '#64748b', fontSize: 12 }}>Всего точек данных</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{chartData.length}</div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          <button onClick={zoomIn} style={buttonStyle}>Zoom In</button>
          <button onClick={zoomOut} style={buttonStyle}>Zoom Out</button>
          <button onClick={panLeft} style={buttonStyle}>← Pan</button>
          <button onClick={panRight} style={buttonStyle}>Pan →</button>
          <button onClick={fitAll} style={buttonStyle}>Fit All</button>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={dotsVisible} onChange={() => setDotsVisible(v => !v)} /> Показать точки
          </label>

          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ color: '#475569', fontSize: 13 }}>Sampling: </div>
            <input type="range" min={1} max={20} value={samplingStep} onChange={(e) => setSamplingStep(Number(e.target.value))} />
            <div style={{ width: 36, textAlign: 'center' }}>{samplingStep}x</div>
          </label>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={() => exportCSV(false)} style={buttonStyle}>Export CSV (all)</button>
            <button onClick={() => exportCSV(true)} style={buttonStyle}>Export CSV (visible)</button>
          </div>
        </div>

        {/* Range and jump */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <label style={{ color: '#475569', fontSize: 13 }}>Показать последних:</label>
            <select value={showLast} onChange={(e) => setShowLast(e.target.value === 'all' ? 'all' : Number(e.target.value))} style={{ padding: 6 }}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={'all'}>Все</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <label style={{ color: '#475569', fontSize: 13 }}>Диапазон:</label>
            <input 
              type="range" 
              min={0} 
              max={Math.max(0, chartData.length - 1)} 
              value={startIndex} 
              onChange={(e) => { 
                const v = Number(e.target.value); 
                setStartIndex(Math.min(v, endIndex)); 
              }} 
            />
            <input 
              type="range" 
              min={0} 
              max={Math.max(0, chartData.length - 1)} 
              value={endIndex} 
              onChange={(e) => { 
                const v = Number(e.target.value); 
                setEndIndex(Math.max(v, startIndex)); 
              }} 
            />
            <div style={{ fontSize: 12, color: '#64748b' }}>{`${startIndex} — ${endIndex}`}</div>
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <label style={{ color: '#475569', fontSize: 13 }}>Перейти к дате:</label>
            <input type="datetime-local" onChange={(e) => jumpToDate(e.target.value)} />
          </div>
        </div>

        {/* Chart - теперь обновляется минимально */}
        <div style={{ background: '#fff', borderRadius: 8, padding: 12, boxShadow: '0 6px 20px rgba(2,6,23,0.04)', height: 420 }} ref={chartRef}>
          {chartData.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>Нет данных для отображения</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={visibleData}
                onMouseMove={handleChartMouseMove}
                onMouseLeave={handleChartMouseLeave}
                onClick={handleChartClick}
                margin={{ top: 12, right: 24, left: 8, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tickFormatter={(v) => v || ''} />
                <YAxis domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area dataKey="anxiety" type="monotone" fill="#8b5cf6" fillOpacity={0.06} isAnimationActive={false} />
                <Line
                  dataKey="anxiety"
                  type="monotone"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={dotsVisible ? { r: 3 } : false}
                  activeDot={{ r: 6 }}
                  isAnimationActive={false}
                />
                <ReferenceLine y={70} stroke="#10b981" strokeDasharray="3 3" />
                <ReferenceLine y={30} stroke="#ef4444" strokeDasharray="3 3" />
                <Brush
                  dataKey="time"
                  height={26}
                  stroke="#8b5cf6"
                  startIndex={startIndex}
                  endIndex={endIndex}
                  onChange={(e) => {
                    if (e && typeof e === 'object') {
                      if (typeof e.startIndex === 'number') setStartIndex(e.startIndex);
                      if (typeof e.endIndex === 'number') setEndIndex(e.endIndex);
                    }
                  }}
                />
                {highlightedPoint && highlightedPoint.index >= startIndex && highlightedPoint.index <= endIndex && (
                  <ReferenceLine
                    x={highlightedPoint.time}
                    stroke="#334155"
                    strokeWidth={1}
                    label={{ value: '●', position: 'top', fill: '#334155' }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ color: '#94a3b8', fontSize: 13 }}>Подсказка:</div>
          <div style={{ color: '#64748b', fontSize: 13 }}>Подвести курсор — посмотреть подробности. Клик — зафиксировать точку. Стрелки ← → — смещение зафиксированной точки.</div>
        </div>

        <div style={{ marginTop: 20 }}>
          <Link to={`/team/${teamId}`} style={{ ...buttonStyle, background: '#3b82f6', color: 'white', border: 'none' }}>Назад к команде</Link>
        </div>
      </main>
    </div>
  );
}