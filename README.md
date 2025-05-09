# Driver App

React Native 기반의 드라이버용 모바일 애플리케이션입니다.

## 기술 스택

- React Native 0.78.2
- TypeScript
- React Navigation 7.x
- React Native Reanimated
- React Native Gesture Handler
- Google Sign-In
- AsyncStorage
- Axios
- React Native Calendars
- React Native Geolocation Service

## 시작하기

### 필수 요구사항

- Node.js >= 18
- Yarn
- Xcode (iOS 개발용)
- Android Studio (Android 개발용)
- CocoaPods (iOS 개발용)

### 설치

1. 저장소 클론
```bash
git clone [repository-url]
cd driver
```

2. 의존성 설치
```bash
yarn install
```

3. iOS 의존성 설치 (iOS 개발 시)
```bash
cd ios
pod install
cd ..
```

### 개발 서버 실행

```bash
yarn start
```

### 앱 실행

iOS:
```bash
yarn ios
```

Android:
```bash
yarn android
```

## 프로젝트 구조

```
src/
  ├── components/     # 재사용 가능한 컴포넌트
  ├── screens/        # 화면 컴포넌트
  ├── navigation/     # 네비게이션 설정
  ├── context/       # Context API 관련 파일
  ├── services/      # API 서비스
  ├── utils/         # 유틸리티 함수
  └── types/         # TypeScript 타입 정의
```

## 주요 기능

- Google 로그인
- 위치 기반 서비스
- 캘린더 기능
- 안전한 네비게이션
- 상태 관리 (Context API)

## 개발 가이드

### 코드 스타일

- ESLint와 Prettier를 사용하여 코드 스타일을 유지합니다.
- TypeScript를 사용하여 부분적으로 타입 안정성을 보장합니다.

### 테스트

```bash
yarn test
```

## 라이선스

NONE