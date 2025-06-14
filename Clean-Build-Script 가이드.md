# Clean Build Scripts 가이드

## 빠른 시작

### iOS 완전 초기화 및 빌드
```bash
npm run clean-build-ios
```

### Android 완전 초기화 및 빌드
```bash
npm run clean-build-android
```

### 전체 프로젝트 초기화 (모든 플랫폼)
```bash
npm run fresh-install
```

## 스크립트 상세 설명

### 캐시 관련
- `npm run clean-cache` - Metro, React Native, npm 캐시 모두 삭제
- `npm run reset-cache` - 캐시 삭제 후 Metro 서버 재시작
- `npm run clean-asyncstorage-ios` - iOS 시뮬레이터의 AsyncStorage 데이터 삭제 (manifest.json 에러 해결)

### iOS 관련
- `npm run clean-ios` - iOS 빌드 캐시, DerivedData, CocoaPods 캐시 삭제
- `npm run clean-build-ios` - 캐시 삭제 → iOS 빌드 정리 → 재빌드
- `npm run clean-simulator` - 모든 iOS 시뮬레이터 초기화

### Android 관련
- `npm run clean-android` - Android 빌드 정리 및 재빌드
- `npm run clean-build-android` - 캐시 삭제 → Android 빌드 정리 → 재빌드

### 전체 초기화
- `npm run clean-all` - 모든 플랫폼 캐시 및 node_modules 삭제
- `npm run fresh-install` - 완전 초기화 후 재설치 (가장 강력한 초기화)

## 문제 해결

### manifest.json 에러 발생 시
```bash
# iOS AsyncStorage 데이터 삭제
npm run clean-asyncstorage-ios

# 전체 초기화 및 재빌드
npm run clean-build-ios
```

### 빌드 오류 발생 시
```bash
# 완전 초기화 (권장)
npm run fresh-install

# iOS만 재빌드
npm run clean-build-ios

# Android만 재빌드
npm run clean-build-android
```

### Metro 번들러 오류 시
```bash
# Metro 캐시만 삭제
npm run reset-cache
```

## 권장 사용 순서

1. **일반적인 빌드 오류**
   ```bash
   npm run clean-cache
   npm run ios  # 또는 npm run android
   ```

2. **지속적인 오류**
   ```bash
   npm run clean-build-ios  # iOS의 경우
   npm run clean-build-android  # Android의 경우
   ```

3. **심각한 오류 (최후의 수단)**
   ```bash
   npm run fresh-install
   ```

## 주의사항

- `fresh-install`은 모든 것을 삭제하므로 시간이 오래 걸립니다
- iOS 빌드 후 처음 실행 시 시간이 더 걸릴 수 있습니다
- 시뮬레이터 초기화(`clean-simulator`)는 모든 시뮬레이터 데이터를 삭제합니다