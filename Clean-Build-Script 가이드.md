# Clean Build Scripts 가이드

## 🧹 캐시 및 빌드 정리 스크립트

React Native 프로젝트에서 발생하는 다양한 캐시 관련 문제를 해결하기 위한 스크립트 모음입니다.

## 주요 스크립트

### 🔥 완전 초기화 (권장)
```bash
npm run fresh-install
```
- 모든 캐시, node_modules, iOS Pods 삭제 후 재설치
- **manifest.json 오류 등 대부분의 문제 해결**

### 📱 iOS 전용

#### AsyncStorage 초기화
```bash
npm run clean-asyncstorage-ios
```
- iOS 시뮬레이터의 AsyncStorage 데이터 완전 삭제
- manifest.json 오류 해결에 효과적

#### iOS 클린 빌드
```bash
npm run clean-build-ios
```
- 캐시 삭제 → iOS 빌드 정리 → Pod 재설치 → 앱 실행

#### 시뮬레이터 초기화
```bash
npm run clean-simulator
```
- 모든 iOS 시뮬레이터 데이터 초기화

### 🤖 Android 전용

#### Android 클린 빌드
```bash
npm run clean-build-android
```
- 캐시 삭제 → Gradle 정리 → 앱 실행

### 🗑️ 캐시 정리

#### Metro 번들러 캐시 정리
```bash
npm run clean-cache
```
- Watchman, Metro, Haste 캐시 모두 삭제

#### 간단한 캐시 리셋
```bash
npm run reset-cache
```
- Metro 번들러만 리셋

## 문제별 해결 방법

### manifest.json 오류 발생 시
```bash
# 1. AsyncStorage 초기화
npm run clean-asyncstorage-ios

# 2. 그래도 안되면 완전 초기화
npm run fresh-install
```

### 빌드 오류 발생 시
```bash
# iOS
npm run clean-build-ios

# Android
npm run clean-build-android
```

### 알 수 없는 캐시 문제
```bash
# 모든 것을 초기화
npm run fresh-install
```

## 스크립트 설명

| 스크립트 | 설명 |
|---------|------|
| `clean-cache` | Metro, React Native, npm 캐시 완전 삭제 |
| `clean-asyncstorage-ios` | iOS AsyncStorage 데이터 삭제 |
| `clean-simulator` | iOS 시뮬레이터 초기화 |
| `clean-ios` | iOS 빌드 폴더 정리 |
| `clean-android` | Android 빌드 정리 |
| `clean-all` | 모든 플랫폼 캐시 정리 |
| `fresh-install` | 완전 초기화 후 재설치 |
| `clean-build-ios` | iOS 클린 빌드 |
| `clean-build-android` | Android 클린 빌드 |

## 주의사항

- `fresh-install`은 모든 로컬 데이터를 삭제합니다
- 시뮬레이터 초기화 시 앱 데이터가 모두 삭제됩니다
- 빌드 정리 후 첫 빌드는 시간이 오래 걸릴 수 있습니다

## 권장 순서

1. 먼저 `clean-cache` 시도
2. 안되면 플랫폼별 클린 빌드 (`clean-build-ios/android`)
3. 그래도 안되면 `fresh-install`
4. 마지막으로 `clean-simulator` (iOS만)