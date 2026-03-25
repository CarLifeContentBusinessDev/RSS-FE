import { useState, useRef, useEffect } from 'react';
import { addYouTubeChannelWithProgress } from '../api';
import { useChannels } from '../context/ChannelContext.jsx';

function YoutubeChannel() {
  const { isLoading, setIsLoading, refreshChannels } = useChannels();
  const [youtubeError, setYoutubeError] = useState('');
  const [channelUrl, setChannelUrl] = useState('');
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

  async function handleAddChannel(e) {
    e.preventDefault();
    setIsLoading(true);
    setYoutubeError('');
    setLogs([{ text: '채널 정보를 가져오는 중...', type: 'info' }]);

    try {
      const result = await addYouTubeChannelWithProgress(channelUrl, (event) => {
        if (event.type === 'start') {
          appendLog(`총 ${event.total}개 영상 처리를 시작합니다...`);
        } else if (event.type === 'video_start') {
          appendLog(`[${event.current}/${event.total}] 처리 중... (${event.videoId})`);
        } else if (event.type === 'video_done') {
          appendLog(`[${event.current}/${event.total}] ✓ ${event.title}`, 'done');
        } else if (event.type === 'video_skip') {
          appendLog(`[${event.current}/${event.total}] - 건너뜀: ${event.reason}`, 'skip');
        }
      });
      appendLog(`완료: 성공 ${result.success ?? '?'}개 / 실패 ${result.failed ?? '?'}개`, 'done');
      await refreshChannels();
      setChannelUrl('');
    } catch (err) {
      setYoutubeError(err.message || '채널 추가 실패');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className='add-channel'>
      <h2>YouTube 채널/플레이리스트 추가</h2>
      <form onSubmit={handleAddChannel}>
        <div className='form-group'>
          <input
            type='text'
            placeholder='youtube.com/@채널명 또는 youtube.com/playlist?list=...'
            value={channelUrl}
            onChange={(e) => setChannelUrl(e.target.value)}
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
      <p className='notice'>
        ※ 오디오 추출 및 R2 업로드가 자동으로 진행됩니다. 시간이 소요될 수
        있습니다.
      </p>
      {youtubeError && <div className='error'>{youtubeError}</div>}
    </section>
  );
}

export default YoutubeChannel;
