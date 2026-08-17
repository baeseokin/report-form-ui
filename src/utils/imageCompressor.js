/**
 * 브라우저 환경에서 동작하는 경량 이미지 압축 및 리사이징 유틸리티
 * 저사양 스마트폰의 메모리 부족(OOM) 방지를 위해 1장씩 순차 압축을 지원합니다.
 */

/**
 * 단일 이미지 파일 압축
 * @param {File} file - 원본 File 객체
 * @param {Object} options - 압축 옵션
 * @param {number} options.maxWidth - 최대 가로폭 (기본 1600px)
 * @param {number} options.maxHeight - 최대 세로높이 (기본 1600px)
 * @param {number} options.quality - 압축 품질 (0.1 ~ 1.0, 기본 0.8)
 * @param {string} options.outputType - 결과 포맷 ('image/jpeg' 기본)
 * @returns {Promise<File>} 압축된 File 객체 (이미지가 아니거나 실패 시 원본 반환)
 */
export async function compressImage(file, options = {}) {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.8,
    outputType = "image/jpeg",
  } = options;

  // 이미지 파일이 아니면 원본 그대로 반환
  if (!file || !file.type || !file.type.startsWith("image/")) {
    return file;
  }

  // SVG나 GIF(애니메이션)는 Canvas 압축 시 깨지므로 원본 유지
  if (file.type === "image/svg+xml" || file.type === "image/gif") {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      const img = new Image();

      img.onload = () => {
        try {
          let { width, height } = img;

          // 크기 리사이징 비율 계산
          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            // 캔버스 컨텍스트 획득 실패 시 원본 반환
            return resolve(file);
          }

          // 투명 배경이 있는 PNG 등을 JPEG로 변환 시 흰색 배경 채우기
          if (outputType === "image/jpeg") {
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, width, height);
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                return resolve(file);
              }

              // 압축 후 파일이 원본보다 오히려 커진 경우 원본 유지
              if (blob.size >= file.size) {
                return resolve(file);
              }

              // 확장자 보정 (JPEG 변환 시)
              let newName = file.name;
              if (outputType === "image/jpeg" && !/\.(jpe?g)$/i.test(newName)) {
                newName = newName.replace(/\.[^.]+$/, "") + ".jpg";
              }

              const compressedFile = new File([blob], newName, {
                type: outputType,
                lastModified: Date.now(),
              });

              resolve(compressedFile);
            },
            outputType,
            quality
          );
        } catch (err) {
          console.warn("이미지 압축 중 예외 발생, 원본 파일 유지:", err);
          resolve(file);
        }
      };

      img.onerror = () => {
        // 이미지 로드 실패 시 원본 반환
        resolve(file);
      };

      img.src = readerEvent.target.result;
    };

    reader.onerror = () => {
      // 파일 읽기 실패 시 원본 반환
      resolve(file);
    };

    reader.readAsDataURL(file);
  });
}

/**
 * 다중 파일 순차 압축 (저사양 모바일 브라우저 OOM 방지)
 * @param {File[]} files - 파일 배열
 * @param {Object} options - 압축 옵션
 * @param {function(current: number, total: number, currentFileName: string): void} onProgress - 진행 콜백
 * @returns {Promise<File[]>} 최적화된 파일 배열
 */
export async function compressFilesSequentially(files, options = {}, onProgress = null) {
  const result = [];
  const total = files.length;

  for (let i = 0; i < total; i++) {
    const file = files[i];
    if (typeof onProgress === "function") {
      onProgress(i + 1, total, file.name);
    }

    // 저사양 폰 UI 스레드 반응성을 위해 틱 양보
    await new Promise((r) => setTimeout(r, 10));

    try {
      const compressed = await compressImage(file, options);
      result.push(compressed);
    } catch (e) {
      console.warn(`파일 ${file.name} 압축 실패, 원본 사용:`, e);
      result.push(file);
    }
  }

  return result;
}
