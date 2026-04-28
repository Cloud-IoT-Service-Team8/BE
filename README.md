# 스마트 헬스케어 백엔드 서버

클라우드IoT서비스(3222) 8팀 — On-Premise 백엔드 서버

Raspberry Pi(엣지 디바이스)가 MQTT로 publish한 섬망 이벤트를 수신하여 유효성 검증, 디바이스 인증, DB 저장, 보호자 SMS 알림까지 처리하는 서버입니다.

---

## 시스템 요구사항

- Node.js 18 이상
- Mosquitto MQTT 브로커 (로컬 설치)

---

## 설치 및 실행 방법

### 1. 패키지 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env.example`을 복사하여 `.env` 파일을 생성한 뒤, 값을 채워주세요.

```bash
cp .env.example .env
```

각 변수 설명은 `.env.example` 파일 내 주석을 참고하세요.

### 3. Mosquitto 브로커 실행

서버를 시작하기 전에 Mosquitto가 먼저 실행되어 있어야 합니다.

**macOS (Homebrew)**

```bash
brew services start mosquitto
```

**Ubuntu / Raspberry Pi**

```bash
sudo systemctl start mosquitto
```

**Windows**

```bash
mosquitto -v
```

기본 포트는 `1883`입니다.

### 4. 초기 데이터 삽입 (최초 1회)

테스트용 사용자, 디바이스, 보호자 데이터를 DB에 삽입합니다.

```bash
npm run seed
```

실행 후 출력된 `device_id`와 `API Key`를 Raspberry Pi의 `.env`에 설정하세요.

```
[Seed] device_id : rpi-001
[Seed] API Key   : xxxxxxxxxxxxxxxx
[Seed] Pi의 .env에 API_KEY=xxxxxxxx 를 추가하세요.
```

### 5. 서버 실행

```bash
# 운영 환경
npm start

# 개발 환경 (파일 변경 시 자동 재시작)
npm run dev
```

서버가 정상 실행되면 아래와 같이 출력됩니다.

```
[Express] Server running on port 3000
[MQTT] Connected to broker: mqtt://localhost:1883
[MQTT] Subscribed to topic: healthcare/+/event
```

---

## 동작 확인

서버가 실행된 상태에서 아래 두 가지로 동작을 확인할 수 있습니다.

### 1. MQTT 이벤트 publish 테스트

`mosquitto_pub`으로 테스트 이벤트를 직접 전송합니다.

```bash
mosquitto_pub -h localhost -p 1883 -t "healthcare/user-001/event" -m '{
  "eventId": "evt-test-001",
  "deviceId": "rpi-001",
  "userId": "user-001",
  "eventType": "DELIRIUM_EXIT_RISK",
  "severity": "HIGH",
  "timestamp": "2026-04-28T02:30:00.000Z",
  "deliriumSuspected": true,
  "abnormalExit": true,
  "doorOpen": true,
  "rfidDetected": false,
  "buzzerActivated": true,
  "processedSensorData": {
    "heartRate": 95,
    "sleepState": "awake",
    "activityLevel": 0.8,
    "doorDistanceCm": 5.2
  }
}'
```

> `eventId`는 매번 다르게 바꿔야 중복으로 무시되지 않습니다.

서버 콘솔에 아래와 같이 출력되면 정상입니다.

```
[EventService] Event saved to SQLite: evt-test-001
[MQTT] Event processed: evt-test-001
```

환경별로 SMS 알림에 대한 AWS 설정이 달라야하므로, 테스트 시에는 `.env`에서 `ALERT_CHANNEL=console`로 설정해 SMS 내용이 콘솔에 함께 출력되는 것을 확인합니다.

### 2. 저장된 이벤트 조회

브라우저 또는 curl로 REST API를 호출합니다.

```bash
curl http://localhost:3000/api/events
```

