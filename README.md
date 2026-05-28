# RSS 피드 생성기

YouTube, 팟빵, Spotify 콘텐츠를 RSS 피드로 변환하는 웹 애플리케이션입니다.

## 개요

이 프로젝트는 다양한 플랫폼의 콘텐츠를 표준 RSS 피드로 제공하여 팟캐스트 앱에서 구독할 수 있도록 합니다.

### 지원 플랫폼

- **YouTube**: 채널 또는 플레이리스트를 RSS 피드로 변환 (자동 오디오 추출 지원)
- **팟빵**: 팟빵 채널을 RSS 피드로 변환
- **Spotify**: Spotify 팟캐스트 쇼를 RSS 피드로 변환

## 시작하기

### 사전 요구사항

- Node.js 18 이상
- npm 또는 yarn
- 백엔드 서버 실행 필요 (NestJS)

### 설치 방법

1. 레포지토리 클론

```bash
git clone <repository-url>
cd <your-folder-name>
```

2. 의존성 설치

```bash
npm install
```

3. 환경 변수 설정

루트 디렉토리에 `.env` 파일을 생성하고 다음 변수를 설정합니다:

```env
# 백엔드 서버 배포시 변경 필수
VITE_API_URL=http://localhost:3000
```

4. 개발 서버 실행

```bash
npm run dev
```

프론트엔드가 http://localhost:5173 에서 실행됩니다.

### 백엔드 서버

이 프론트엔드는 별도의 NestJS 백엔드 서버와 통신합니다. 백엔드 서버를 먼저 실행해야 합니다.

기본적으로 로컬에서 백엔드는 `http://localhost:3000`에서 실행됩니다.

## 주요 기능

### YouTube 처리

- 채널 URL 또는 플레이리스트 URL 입력
- 자동으로 영상에서 오디오 추출
- Cloudflare R2에 오디오 파일 업로드
- RSS 피드 생성 및 URL 반환

### 팟빵 처리

- 채널 ID 또는 전체 URL 입력 가능
- 팟빵 API에서 메타데이터 및 에피소드 정보 가져오기
- RSS 피드 생성

### Spotify 처리

- Spotify 쇼 URL 입력
- Apple Podcasts에서 동일한 쇼의 RSS 피드 검색
- 찾은 RSS 피드 URL 반환

## 프로젝트 구조

```
yt-rss-maker/
├── src/
│   ├── App.jsx           # 메인 애플리케이션 컴포넌트
│   ├── App.css           # 스타일시트
│   ├── api.js            # 백엔드 API 호출 함수
│   ├── main.jsx          # React 엔트리 포인트
│   └── index.css         # 전역 스타일
├── public/               # 정적 파일 (이미지, 아이콘 등)
├── index.html            # HTML 템플릿
├── vite.config.js        # Vite 설정
├── package.json          # 프로젝트 의존성
└── README.md             # 프로젝트 문서
```

## 개발

### 사용 가능한 스크립트

- `npm run dev`: 개발 서버 실행 (Hot Module Replacement 지원)
- `npm run build`: 프로덕션 빌드 생성
- `npm run preview`: 빌드된 결과물 미리보기
- `npm run lint`: ESLint로 코드 검사

### 빌드

프로덕션 빌드를 생성하려면:

```bash
npm run build
```

빌드 결과물은 `dist/` 디렉토리에 생성됩니다.

## API 엔드포인트

프론트엔드는 다음 백엔드 엔드포인트를 사용합니다:

- `POST /youtube/process`: YouTube 채널/플레이리스트 처리
- `POST /youtube/update/:id`: YouTube 채널 업데이트, `author` 옵션 지원
- `POST /api/podbbang/channel`: 팟빵 채널 추가
- `POST /api/podbbang/update/:id`: 팟빵 채널 업데이트
- `POST /api/spotify/find-rss`: Spotify 쇼의 RSS 피드 검색
- `POST /api/spotify/update/:id`: Spotify 쇼 업데이트
- `GET /api/channels`: 모든 채널 목록 조회
- `DELETE /api/channel/:id`: 채널 삭제
- `GET /rss/:id`: RSS 피드 조회

## 기술 스택

- **React 19**: UI 라이브러리
- **Vite**: 빌드 도구 및 개발 서버
- **CSS**: 스타일링
- **Fetch API**: HTTP 요청 처리

## 배포

### 환경 변수

프로덕션 환경에서는 다음 환경 변수를 설정해야 합니다:

- `VITE_API_URL`: 백엔드 API 서버 URL
