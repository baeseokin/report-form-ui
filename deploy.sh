#!/bin/bash

# 사용법: ./deploy.sh <VERSION>
# 예시: ./deploy.sh 0.1

if [ -z "$1" ]; then
  echo "❌ 사용법: $0 <VERSION>"
  exit 1
fi

VERSION=$1
IMAGE_NAME="baeseokin/report-form-ui"

echo "🚀 UI 배포 시작 (버전: $VERSION)..."

# 1. Docker Buildx 환경 확인/생성
if ! docker buildx inspect multiarch-builder >/dev/null 2>&1; then
  echo "🔧 buildx 빌더 생성 중..."
  docker buildx create --name multiarch-builder --use
  docker buildx inspect --bootstrap
fi

# 2. 멀티 아키텍처 이미지 빌드 & 푸시
echo "📦 멀티 아키텍처 이미지 빌드 중 (linux/amd64, linux/arm64)..."
docker buildx build --platform linux/amd64,linux/arm64 \
  -t $IMAGE_NAME:$VERSION \
  --push .

if [ $? -ne 0 ]; then
  echo "❌ 이미지 빌드 실패!"
  exit 1
fi

# 3. Kubernetes Deployment 업데이트
echo "📡 Kubernetes 배포 업데이트..."
kubectl set image deployment/report-form-ui report-form-ui=$IMAGE_NAME:$VERSION -n tomcat-test

# 4. 롤아웃 확인
kubectl rollout status deployment/report-form-ui -n tomcat-test

echo "✅ UI 배포 완료!"
echo "👉 http://localhost:30001 에서 확인하세요."
