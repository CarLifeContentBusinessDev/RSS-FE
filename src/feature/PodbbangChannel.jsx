import { useState, useRef, useEffect } from 'react';
import { useChannels } from '../context/ChannelContext.jsx';
import { addPodbbangChannelWithProgress } from '../api.js';

function PodbbangChannel() {
  const { isLoading, setIsLoading, refreshChannels } = useChannels();
  const [podbbangId, setPodbbangId] = useState('');
  const [podbbangError, setPodbbangError] = useState('');
  const [logs, setLogs] = useState([]);
  const terminalRef = useRef(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  function appendLog(text, type = 'info') {
    setLogs((prev) => [...prev, { text, type }]);
  }

  async function handleAddPodbbang(e) {
    e.preventDefault();
    setIsLoading(true);
    setPodbbangError('');
    setLogs([{ text: '채널 정보를 가져오는 중...', type: 'info' }]);

    try {
      let channelId = podbbangId.trim();
      const urlMatch = channelId.match(/channels\/(\d+)/);

      if (urlMatch) {
        channelId = urlMatch[1];
      } else {
        channelId = channelId.replace(/\D/g, '');
      }

      if (!channelId) {
        setPodbbangError('유효한 채널 ID 또는 URL을 입력해주세요');
        setIsLoading(false);
        setLogs([]);
        return;
      }

      const result = await addPodbbangChannelWithProgress(channelId, (event) => {
        if (event.type === 'start') appendLog(`총 ${event.total}개 에피소드`);
        if (event.type === 'fetch_page') appendLog(`페이지 ${event.current}/${event.total} 가져오는 중...`);
      });
      appendLog(`완료: ${result.total ?? ''}개 에피소드`, 'done');
      await refreshChannels();
      setPodbbangId('');
    } catch (err) {
      setPodbbangError(err.message || '팟빵 채널 추가 실패');
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className='add-channel'>
      <h2>팟빵 채널 추가</h2>
      <form onSubmit={handleAddPodbbang}>
        <div className='form-group'>
          <input
            type='text'
            placeholder='podbbang.com/channels/1781651 또는 채널 ID'
            value={podbbangId}
            onChange={(e) => setPodbbangId(e.target.value)}
            required
            disabled={isLoading}
          />
          <button type='submit' disabled={isLoading}>
            {isLoading ? '추가 중...' : '추가'}
          </button>
        </div>
      </form>
      {logs.length > 0 && (
        <div className='terminal' ref={terminalRef}>
          {logs.map((log, i) => (
            <div key={i} className={`terminal-line terminal-line--${log.type}`}>
              {log.text}
            </div>
          ))}
        </div>
      )}
      {podbbangError && <div className='error'>{podbbangError}</div>}
    </section>
  );
}

export default PodbbangChannel;
