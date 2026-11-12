// 화면(E2E) 테스트 설정
//   - 테스트 전용 백엔드(report-server, 포트 3101, 테스트 DB)와 프론트엔드(Vite, 포트 5174)를
//     Playwright 가 직접 띄우고 테스트가 끝나면 종료합니다. 운영·개발 서버와 포트가 겹치지 않습니다.
//   - 실행: npm run test:e2e   (report-server 의 테스트 DB 컨테이너는 자동으로 시작)
import { defineConfig, devices } from "@playwright/test";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const SERVER_DIR = process.env.REPORT_SERVER_DIR || path.resolve(__dirname, "../report-server");
const API_PORT = 3101;
const WEB_PORT = 5174;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.js",
  globalTeardown: "./e2e/global-teardown.js",
  fullyParallel: false,
  workers: 1,              // 하나의 테스트 DB를 공유하므로 순차 실행
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { outputFolder: "e2e-report", open: "never" }]],
  outputDir: "e2e-results",
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    trace: "retain-on-failure",
  },
  // 모든 케이스를 PC · iPhone · Android 세 환경에서 모두 실행합니다.
  //   - 모바일은 기기 에뮬레이션(화면 크기·터치·모바일 UA)이며, 앱이 모바일 전용 화면(components/mobile)으로 전환됩니다.
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
    { name: "iphone", use: { ...devices["iPhone 14"] } },
    { name: "android", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      // 테스트 전용 백엔드 (테스트 DB 사용, 알림톡 발송 안 함)
      command: "node server.js",
      cwd: SERVER_DIR,
      port: API_PORT,
      reuseExistingServer: false,
      timeout: 30_000,
      env: {
        NODE_ENV: "test",
        PORT: String(API_PORT),
        DB_HOST__test: "127.0.0.1",
        DB_PORT__test: "33306",
        DB_USER__test: "root",
        DB_PASSWORD__test: "test",
        DB_NAME__test: "reportdb_test",
        SESSION_SECRET__test: "e2e-session-secret",
        CORS_ORIGIN__test: `http://localhost:${WEB_PORT}`,
        UPLOAD_DIR: path.join(os.tmpdir(), "report-e2e-uploads"),
        ALIMTALK_DISABLED: "true",
      },
    },
    {
      // 프론트엔드 (API 는 위 테스트 백엔드로 프록시)
      command: `npx vite --port ${WEB_PORT} --strictPort`,
      port: WEB_PORT,
      reuseExistingServer: false,
      timeout: 60_000,
      env: { VITE_API_PROXY: `http://localhost:${API_PORT}` },
    },
  ],
});
