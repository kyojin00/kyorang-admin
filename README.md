# 교랑톡 관리자 대시보드

Next.js 14 + Supabase + Tailwind CSS

## 기능

- **신고 관리**: 신고 목록, 상세 보기, 처리 (완료/반려), 메모
- **사용자 관리**: 닉네임 검색, 신고/차단 누적 사용자 표시
- **통계**: 일별 신고 추이, 사유별 분포, 핵심 지표

## 1. 설치

```powershell
cd kyorang-admin
npm install
```

## 2. 환경변수 설정

`.env.local.example` 을 `.env.local` 로 복사하고 채워넣기:

```powershell
copy .env.local.example .env.local
notepad .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://taohtzdmqsvhbxfqfvmq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # ⚠️ 절대 외부 노출 금지
NEXT_PUBLIC_ADMIN_USER_IDS=4e4161a5-dea4-4953-a4f6-a5424fd524b0
```

### Supabase 키 가져오기

1. https://supabase.com/dashboard 접속
2. 프로젝트 선택 → Settings → API
3. **anon public** 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **service_role** 키 → `SUPABASE_SERVICE_ROLE_KEY`

### 관리자 user_id

본인의 Supabase Auth user_id (UUID). 여러 명이면 콤마로 구분:
```
NEXT_PUBLIC_ADMIN_USER_IDS=uuid-1,uuid-2,uuid-3
```

## 3. 개발 서버 실행

```powershell
npm run dev
```

브라우저에서 http://localhost:3000 접속 → 로그인 → 신고 관리 화면

## 4. Vercel 배포

### 방법 A: GitHub 연동 (추천)

1. `kyorang-admin` 폴더를 GitHub 저장소로 push
2. https://vercel.com/new 접속
3. GitHub 저장소 import
4. **Environment Variables** 에 `.env.local` 의 값들 모두 입력
5. Deploy 클릭

배포 URL: `kyorang-admin.vercel.app` 또는 본인이 지정한 이름

### 방법 B: Vercel CLI

```powershell
npm i -g vercel
cd kyorang-admin
vercel
```

CLI 가 환경변수 입력 도와줌.

## 5. 도메인 연결 (선택)

Vercel Dashboard → Project → Settings → Domains
- `admin.kyorang.com` 같은 서브도메인 추가
- DNS 설정 안내 따라하기

## 폴더 구조

```
kyorang-admin/
├ app/
│  ├ (admin)/              # 사이드바 공통 레이아웃
│  │  ├ layout.tsx
│  │  ├ reports/           # 신고 관리
│  │  ├ users/             # 사용자 관리
│  │  └ stats/             # 통계
│  ├ login/                # 로그인 페이지
│  ├ layout.tsx
│  ├ page.tsx
│  └ globals.css
├ components/
│  └ Sidebar.tsx
├ lib/
│  ├ supabase-browser.ts   # 브라우저용 클라이언트
│  ├ supabase-server.ts    # 서버용 (쿠키 기반)
│  ├ supabase-admin.ts     # service role 키 사용 (RLS 우회)
│  └ admin.ts              # 관리자 권한 체크
├ middleware.ts            # 인증/권한 미들웨어
└ .env.local               # 환경변수 (커밋 X)
```

## 권한 체크 흐름

1. 모든 요청은 `middleware.ts` 통과
2. 로그인 안 됨 → `/login` 으로 리다이렉트
3. 로그인 됐는데 `ADMIN_USER_IDS` 에 없음 → `/login?error=not_admin`
4. 관리자 → 통과

## 보안 주의사항

- `SUPABASE_SERVICE_ROLE_KEY` 는 **절대** 클라이언트에 노출 금지
- `lib/supabase-admin.ts` 는 서버 컴포넌트 / API 라우트에서만 사용
- `.env.local` 은 `.gitignore` 에 포함됨 (커밋 X)
- 본인의 anon key 도 가급적 비공개 저장소에 두기

## 트러블슈팅

### "관리자 권한이 없습니다" 에러
→ `.env.local` 의 `NEXT_PUBLIC_ADMIN_USER_IDS` 가 본인 user_id 와 일치하는지 확인

### "Invalid API key"
→ `NEXT_PUBLIC_SUPABASE_URL` 끝에 슬래시(/) 있으면 제거

### 데이터가 안 보여요
→ `SUPABASE_SERVICE_ROLE_KEY` 가 올바르게 설정됐는지 확인 (사용자 페이지/통계는 service role 필요)

### 신고 처리 시 권한 오류
→ Supabase 에서 `kyorangtalk_reports` 테이블의 UPDATE RLS 정책 확인. 관리자 user_id 만 update 가능하게 설정 필요

## RLS 정책 예시 (Supabase SQL Editor)

```sql
-- 관리자만 신고 update 가능
CREATE POLICY "admin_update_reports"
ON kyorangtalk_reports
FOR UPDATE
TO authenticated
USING (
  auth.uid() = '4e4161a5-dea4-4953-a4f6-a5424fd524b0'::uuid
)
WITH CHECK (
  auth.uid() = '4e4161a5-dea4-4953-a4f6-a5424fd524b0'::uuid
);
```

여러 관리자면:
```sql
USING (
  auth.uid() = ANY(ARRAY[
    '4e4161a5-dea4-4953-a4f6-a5424fd524b0',
    'other-admin-uuid'
  ]::uuid[])
)
```
