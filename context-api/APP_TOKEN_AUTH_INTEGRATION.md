# App Token Auth Integration

이 문서는 dashway App 백엔드가 `context-api`의 access token 검증 API와 연동할 때 따라야 할 기준을 정리한다.

## 기본 원칙

- App 백엔드는 JWT를 직접 파싱하거나 서명을 검증하지 않는다.
- App 백엔드는 요청 시작 지점에서 `context-api`에 access token 검증을 요청한다.
- 검증 성공 시 응답의 `memberId`를 현재 사용자 식별자로 사용한다.
- 검증 실패 또는 검증 API 호출 실패는 인증 실패로 처리한다.
- V1에서는 App 백엔드와 `context-api` 사이에 별도 service secret을 사용하지 않는다.
- 사용자 이름, 이메일, 프로필 이미지는 이 API에서 받지 않는다. App 데이터에는 `memberId`만 저장한다.

## Token Validate API

### Request

```http
POST /api/auth/token/validate HTTP/1.1
Host: context-api-host
Authorization: Bearer <accessToken>
```

- 요청 바디는 없다.
- 토큰은 반드시 `Authorization` 헤더에 `Bearer ` prefix와 함께 전달한다.
- App 백엔드가 클라이언트 요청에서 받은 access token을 그대로 전달한다.

### Success Response

```http
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "memberId": 123
}
```

- `200 OK`가 내려오면 토큰은 유효한 것으로 본다.
- 응답에 `valid` 필드는 없다. 성공 자체가 유효함을 의미한다.
- 응답에 role, email, name, profile image는 없다.

### Failure Response

```http
HTTP/1.1 401 Unauthorized
```

다음 경우는 모두 인증 실패다.

- `Authorization` 헤더가 없음
- `Bearer ` prefix가 없음
- 토큰 형식이 잘못됨
- 토큰 서명이 맞지 않음
- 토큰이 만료됨
- 사용자가 logout해서 access token이 blacklist에 있음

App 백엔드는 `401`을 받으면 자체 API 요청도 `401`로 실패시키거나 WebSocket 연결을 거부한다.

## GraphQL 연동 기준

GraphQL 요청은 요청 시작 시 한 번만 검증한다.

권장 흐름:

1. App 백엔드의 HTTP 요청에서 `Authorization` 헤더를 읽는다.
2. `context-api`의 `POST /api/auth/token/validate`를 호출한다.
3. 성공하면 `memberId`를 request context에 저장한다.
4. resolver와 service는 request context의 `memberId`를 현재 사용자로 사용한다.
5. 실패하면 GraphQL 실행 전에 인증 실패 응답을 반환한다.

GraphQL resolver 안에서 매번 검증 API를 다시 호출하지 않는다.

## WebSocket/STOMP 연동 기준

WebSocket은 연결 시점에 한 번만 검증한다.

권장 흐름:

1. STOMP `CONNECT` frame에서 access token을 읽는다.
2. `context-api`의 `POST /api/auth/token/validate`를 호출한다.
3. 성공하면 `memberId`를 WebSocket session attribute 또는 Principal에 저장한다.
4. 이후 메시지 명령은 저장된 `memberId`를 현재 사용자로 사용한다.
5. 실패하면 연결을 거부한다.

WebSocket 명령마다 토큰 검증 API를 다시 호출하지 않는다.

## Kotlin 호출 예시

Spring `RestClient`를 사용하는 예시다.

```kotlin
data class TokenValidateResponse(
    val memberId: Long,
)

class ContextApiAuthClient(
    private val restClient: RestClient,
) {
    fun validate(accessToken: String): Long {
        val response = restClient.post()
            .uri("/api/auth/token/validate")
            .header("Authorization", accessToken)
            .retrieve()
            .body(TokenValidateResponse::class.java)
            ?: throw UnauthenticatedException()

        return response.memberId
    }
}
```

주의할 점:

- `accessToken` 값은 `Bearer <token>` 형태여야 한다.
- `401`, timeout, connection error는 모두 인증 실패로 처리한다.
- App 백엔드는 token payload를 신뢰하지 않는다.

## 운영 기준

- App 백엔드는 `context-api` base URL을 설정값으로 둔다.
- 검증 호출은 짧은 timeout을 둔다. 호출 실패 시 인증 실패로 닫는다.
- 검증 결과는 요청 단위로만 사용한다.
- GraphQL HTTP 요청 사이에서 검증 결과를 캐시하지 않는다.
- WebSocket은 연결 단위로 검증 결과를 보관할 수 있다.

## 수동 확인 체크리스트

- 유효한 access token으로 검증 API 호출 시 `200`과 `memberId`가 반환된다.
- 토큰 없이 호출하면 `401`이 반환된다.
- 잘못된 토큰으로 호출하면 `401`이 반환된다.
- logout 이후 같은 access token으로 호출하면 `401`이 반환된다.
- App GraphQL 요청은 검증 성공 후 request context의 `memberId`를 사용한다.
- App WebSocket 연결은 검증 성공 후 session의 `memberId`를 사용한다.
