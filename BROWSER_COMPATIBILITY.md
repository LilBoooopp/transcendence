## Browser Compatibility

This project was developed and primarily tested on **Google Chrome**. As part of the *Support for additional browsers* module, full compatibility testing was performed on **Firefox** and **Safari**. All core features - gameplay, matchmaking, real-time synchronization, spectator mode, chat, and notificaitons- work consistently across all three browsers.

### Supported Browsers

| Browser | Version Tested | Status |
| Google Chrome | 130+ | Primary development browser |
| Mozilla Firefox | 130+ | Fully supported |
| Safari | 26+ | Fully supported |
| Microsoft Edge | - | Expected to work |

### Browser-specific Limitations

#### Google Chrome

 - **Drag-and-drop ghost image:** Chrome's HTML5 Drag and Drop API generates drag previews by screenshotting the dragged DOM node in its rendered context. For `<img>` elements inside style containers (e.g., chess pieces inside tiles), the default drag ghost captures the parent tile's background color, producing a visual artifact during piece dragging. This was resolved by suppressing the native preview via `react-dnd`'s, `getEmptyImage()` preview connector and rendering a custom drag layer using `useDragLayer`, which draws the piece image at the cursor position independently of the DOM hierarchy.

#### Mozilla Firefox

- **Drag-and-drop behavior:** Firefox handles native `<img>` drag previews differently from Chrome and does not exhibit the ghost image issue described above. The custom drag layer solution remains active on Firefox for consistency, but Firefox would work without it.
- **WebSocket reconnection timing:** No significant differences observed. Socket.IO's reconnection logic (exponential backoff with jitter) behaves identially to Chrome.
- **CSS rendering:** Minor sub-pixel rounding differences in board tile alighment at certain viewport sizes. These are not visible during normal use and does not affect gameplay.

#### Safari

- **Behavior consistent with Chrome:** All tested features - including drag-and-drop, WebSocket connections through Nginx, game reconnection, notifications, and CSS layout - behaved consistently with Chrome.
- **No Safari-specific limitations observed** during testing.

#### Microsoft Edge (Not Tested)

Edge was not explicity tested but is expected to work without issues. Edge shares Chrome's rending engine (Blink) and JavaScript engine (V8), so all Chrome-specific behaviors and fixes - including the drag-and-drop ghost image resolution - apply identically WebSocket handling, CSS rendering, and JavaScript executiong should be equivalent to Chrome.

#### Mobile Browsers

Mobile is not a primary target platform. The `react-dnd-html5-backend` does not handle touch events, so drag-and-drop piece movement is unavailable on all mobile browsers. However, the tap-to-select interaction model is fully functional as an alternative.

- **Google Chrome (Mobile):** All features work correctly, including gameplay, real-time synchronization, AI games, spectator mode, and notificaitons. Drag-and-drop is the only unsopported interaction.
- **Other mobile browsers (Firefox, Safari):** Gameplay via tap-to-select works, but matchmaking exhibits intermittent issues - queue joining or game create may not behave reliably. The root cause has not be diagnose but may be causes in the methods that mobile browsers handle WebSocket connection in the background or during tab focus changes.

### Testing Methodology

Browser testing was performed manually across all core user flows:

- **Authentication:** Login, registration, JWT token handling
- **Matchmaking:** Queue joining, time control selection, game creation
- **Gameplay:** Piece movement (click and drag), premoves, pawn promotion, draw offeres, resignation
- **Real-time sync:** Move broadcasting, timer synchronization, game-over detection
- **Reconnection:** Disconnect/reconnect within 30-second window, silent cancel before first move
- **Spectator mode:** Joining live games, real-time board updates
- **Notification:** Toest display, animation, and dismissal
- **AI games:** Stockfish difficulty selection, bot move responses

