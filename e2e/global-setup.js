// E2E 시작 전: 테스트 DB 컨테이너 기동 + 스키마 재생성 (report-server 의 테스트 설정 재사용)
import { execFileSync } from "child_process";
import { createRequire } from "module";
import path from "path";
import fs from "fs";
import { SERVER_DIR } from "../playwright.config.js";

export default async function globalSetup() {
  // 이전 실행 스크린샷 정리 (항상 마지막 실행 결과만 남김)
  fs.rmSync(new URL("../e2e-screenshots", import.meta.url), { recursive: true, force: true });
  fs.rmSync(new URL("../e2e-coverage-tmp", import.meta.url), { recursive: true, force: true }); // 이전 실행의 커버리지 임시 결과
  execFileSync(path.join(SERVER_DIR, "scripts/test-db.sh"), ["up"], { stdio: "inherit" });
  const require = createRequire(import.meta.url);
  await require(path.join(SERVER_DIR, "tests/globalSetup.js"))();
}
