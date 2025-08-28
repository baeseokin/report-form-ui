#!/bin/bash

# 사용법: ./deploy.sh <VERSION>
# 예시: ./deploy.sh 0.1

# 1. 버전 파라미터 확인
if [ -z "$1" ]; then
  echo "❌ 사용법: $0 <VERSION>"
  exit 1
fi

VERSION=$1
IMAGE_NAME="baeseokin/report-form-ui"
CONTAINER_NAME="report-form-ui"

echo "🚀 Docker 배포 시작 (버전: $VERSION)..."

# 2. 기존 컨테이너 중지 및 제거
EXISTING_CONTAINER=$(docker ps -aq -f name=$CONTAINER_NAME)

if [ ! -z "$EXISTING_CONTAINER" ]; then
  echo "🛑 기존 컨테이너 중지 및 제거 중..."
  docker stop $CONTAINER_NAME
  docker rm $CONTAINER_NAME
fi

# 3. Docker 이미지 빌드
echo "📦 이미지 빌드 중..."
docker build -t $IMAGE_NAME:$VERSION .

if [ $? -ne 0 ]; then
  echo "❌ 이미지 빌드 실패!"
  exit 1
fi

# 4. Docker Hub에 푸시
echo "📤 Docker Hub로 푸시 중..."
docker push $IMAGE_NAME:$VERSION

if [ $? -ne 0 ]; then
  echo "❌ Docker Hub 푸시 실패!"
  exit 1
fi

# 5. 새 컨테이너 실행
echo "▶️ 새 컨테이너 실행 중 (포트: 8080 -> 80)..."
docker run -d -p 8080:80 --name $CONTAINER_NAME $IMAGE_NAME:$VERSION

if [ $? -ne 0 ]; then
  echo "❌ 컨테이너 실행 실패!"
  exit 1
fi

echo "✅ 배포 완료!"
echo "👉 http://localhost:8080 에서 확인하세요."

