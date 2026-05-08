# Live Smoke Test Checklist

Manual verification steps for V1.1 live mode. Run after `pnpm -C apps/chat/frontend dev` with BE running at `:12001`.

## Prerequisites
- BE running: `http://localhost:12001/graphql` responds
- Valid dev token: set `localStorage.chatAuthToken = '<token>'` in browser console
- `VITE_CHAT_DATA_SOURCE=live` in `.env.local`

## Checklist

- [ ] No CORS errors in browser console after page load
- [ ] `chatRooms` query returns rooms (Network tab: POST /graphql, 200)
- [ ] `Authorization` header present on GraphQL request
- [ ] STOMP WS connects: `ws://localhost:5173/ws/chat` shown in Network > WS tab
- [ ] STOMP CONNECTED frame received (no ERROR frame)
- [ ] Send a message in a room: optimistic row appears immediately
- [ ] STOMP echo arrives within 2s: optimistic row replaced by server-confirmed row
- [ ] V1.1 banner visible in message area (history not available)
- [ ] `dashway:hello` / `dashway:hello.ack` / `dashway:route.navigate` in console (shell embed mode)
- [ ] Token expiry: clear `localStorage.chatAuthToken`, verify STOMP disconnects and banner shows
