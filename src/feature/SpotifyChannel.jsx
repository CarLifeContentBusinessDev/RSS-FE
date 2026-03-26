import { useState, useRef, useEffect } from 'react';
import { useChannels } from '../context/ChannelContext.jsx';
import { addSpotifyShowWithProgress } from '../api.js';

function SpotifyChannel() {
  const { isLoading, setIsLoading, refreshChannels } = useChannels();
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [spotifyError, setSpotifyError] = useState('');
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

  async function handleAddSpotify(e) {
    e.preventDefault();
    setIsLoading(true);
    setSpotifyError('');
    setLogs([{ text: 'Apple Podcasts에서 RSS 피드를 검색하는 중...', type: 'info' }]);

    try {
      await addSpotifyShowWithProgress(spotifyUrl, (event) => {
        if (event.type === 'searching') appendLog(event.message);
        if (event.type === 'start') appendLog(`총 ${event.total}개 에피소드`);
        if (event.type === 'fetch_page') appendLog(`${event.fetched}/${event.total} 에피소드 가져옴`);
      });
      appendLog(`완료: RSS 피드를 찾았습니다`, 'done');
      await refreshChannels();
      setSpotifyUrl('');
    } catch (err) {
      setSpotifyError(err.message || 'Apple Podcasts에서 RSS 피드를 찾을 수 없습니다');
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className='add-channel'>
      <h2>Spotify RSS 찾기</h2>
      <form onSubmit={handleAddSpotify}>
        <div className='form-group'>
          <input
            type='text'
            placeholder='https://open.spotify.com/show/...'
            value={spotifyUrl}
            onChange={(e) => setSpotifyUrl(e.target.value)}
            required
            disabled={isLoading}
          />
          <button type='submit' disabled={isLoading}>
            {isLoading ? 'RSS 검색 중...' : 'RSS 찾기'}
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
      <p className='notice'>
        ※ Spotify 쇼 이름으로 Apple Podcasts에서 RSS 피드를 검색합니다.
      </p>
      {spotifyError && <div className='error'>{spotifyError}</div>}
    </section>
  );
}

export default SpotifyChannel;
