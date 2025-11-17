# Canadian Salad Online - Product Roadmap

This document outlines potential features, enhancements, and improvements for the Canadian Salad Online card game.

## Table of Contents

- [Current State](#current-state)
- [Development Phases](#development-phases)
- [Feature Categories](#feature-categories)
  - [Core Gameplay Enhancements](#core-gameplay-enhancements)
  - [User Experience Improvements](#user-experience-improvements)
  - [Statistics & History](#statistics--history)
  - [Social & Multiplayer Features](#social--multiplayer-features)
  - [Technical Improvements](#technical-improvements)
  - [Performance & Scalability](#performance--scalability)
  - [Monetization](#monetization-optional)
  - [Development & Operations](#development--operations)
- [Quick Wins](#quick-wins-high-impact-low-effort)

---

## Current State

**Production Readiness: 95%**

The game is fully functional with:
- ✅ All 6 game rounds with correct scoring
- ✅ 3-4 player support
- ✅ Real-time synchronization via WebSockets
- ✅ Suit-following validation
- ✅ Disconnect handling (5-minute grace period)
- ✅ Room management with 4-character codes
- ✅ State persistence (snapshots)
- ✅ Mobile-responsive UI
- ✅ Comprehensive test suite (47 tests)
- ✅ Docker and Fly.io deployment configurations

---

## Development Phases

### Phase 1: Polish & User Experience (1-2 weeks)
**Goal:** Make the game feel professional and polished

- [ ] Animations & visual feedback
- [ ] Sound effects & music
- [ ] Better mobile experience
- [ ] Tutorial/onboarding system
- [ ] Round rules reference panel
- [ ] Dark mode toggle
- [ ] Enhanced UI features (card preview, drag-and-drop)

### Phase 2: Retention & Engagement (2-4 weeks)
**Goal:** Keep players coming back

- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] User accounts & authentication
- [ ] Player statistics dashboard
- [ ] Game history & replay
- [ ] Chat system
- [ ] Player profiles & customization

### Phase 3: Growth & Community (4-8 weeks)
**Goal:** Grow the player base

- [ ] Matchmaking & public lobbies
- [ ] Friend system
- [ ] Leaderboards (daily/weekly/all-time)
- [ ] Spectator mode
- [ ] Tournaments & leagues
- [ ] Player ranks & badges

### Phase 4: Scale & Infrastructure (8+ weeks)
**Goal:** Handle growth and improve reliability

- [ ] Redis for state management
- [ ] Horizontal scaling & load balancing
- [ ] Mobile app wrappers (iOS/Android)
- [ ] CDN for static assets
- [ ] Advanced monitoring & analytics
- [ ] Multi-region deployment

---

## Feature Categories

## 🎮 Core Gameplay Enhancements

### 1. Persistent Player Sessions & Reconnection
**Status:** Not Started | **Priority:** High | **Effort:** Medium

- Implement session IDs with localStorage for seamless reconnection after page refresh
- Allow players to rejoin mid-game if disconnected (currently 5-min grace period exists but no active rejoin)
- Add "Are you still there?" prompts before kicking inactive players
- Store session tokens securely

**Technical Notes:**
- Currently uses socket IDs only
- Need to generate persistent session tokens
- Store session-to-socket mapping on server

---

### 2. Spectator Mode
**Status:** Not Started | **Priority:** Medium | **Effort:** Medium

- Allow additional users to watch ongoing games
- Spectators see all hands (like a TV broadcast)
- Add spectator count display
- Spectator chat separate from player chat
- Could monetize with "premium spectator" features

**Technical Notes:**
- Add `spectators` array to Room type
- Send full unfiltered state to spectators
- Handle spectator join/leave events

---

### 3. Game Variants & Custom Rules
**Status:** Not Started | **Priority:** Medium | **Effort:** Medium-High

- Allow hosts to customize point values (e.g., 15 pts per Queen instead of 25)
- Add optional 7th round variations:
  - "No Jacks" (penalties for Jacks)
  - "No Red Cards" (penalties for all red cards)
  - "No Face Cards" (penalties for J/Q/K)
- Create "Quick Salad" mode (3 rounds instead of 6)
- "Reverse Salad" where highest score wins
- Save custom rule presets

**Technical Notes:**
- Add `gameSettings` to Room type
- Make scoring functions parameterized
- Update UI to show custom rules

---

### 4. Pass Cards Phase
**Status:** Not Started | **Priority:** Low | **Effort:** High

- Before certain rounds, players pass 3 cards (common in Hearts variants)
- Pass directions: left, right, across, or keep all (rotates each round)
- Adds strategic depth
- Optional: Make it configurable (enable/disable)

**Technical Notes:**
- Add new game phase: `PASSING_CARDS`
- Track which players have passed
- Validate card selections before allowing round start
- Major change to game flow

---

### 5. AI Players / Bots
**Status:** Not Started | **Priority:** Medium | **Effort:** Very High

- Fill empty seats with computer players for practice
- Useful for 2-player scenarios or solo practice
- Difficulty levels: Easy, Medium, Hard
- AI follows suit-following rules
- Strategic card selection (avoid high-penalty cards)

**Technical Notes:**
- Implement AI decision-making algorithm
- Could use Monte Carlo simulation for hard mode
- Schedule AI turns with realistic timing
- Significant complexity

---

## 🎨 User Experience Improvements

### 6. Animations & Visual Feedback
**Status:** Not Started | **Priority:** High | **Effort:** Medium

- Card flip animations when dealing
- Sliding animation when cards move to trick pile
- Confetti/celebration when winning a round
- Shake animation on invalid card attempts
- Smooth score counter increments
- Fade in/out for overlays

**Technical Notes:**
- Use CSS transitions and animations
- Consider using lightweight animation library (anime.js, GSAP)
- Ensure 60fps performance on mobile

---

### 7. Sound Effects & Music
**Status:** Not Started | **Priority:** High | **Effort:** Low-Medium

- Card shuffle sounds
- Card flip sounds when dealing
- Card "thunk" when played to trick
- Trick-taking sounds (different for winning/losing)
- Round end sounds (victory/defeat)
- Optional background music (lobby, gameplay)
- Mute toggle in settings
- Volume controls

**Technical Notes:**
- Use Web Audio API
- Preload sound files
- Small file sizes (MP3/OGG)
- Respect user preferences (localStorage)

**Assets Needed:**
- ~10-15 sound effects
- 2-3 background music loops (optional)

---

### 8. Enhanced UI Features
**Status:** Not Started | **Priority:** Medium | **Effort:** Medium

- Card preview on hover (enlarged view)
- Drag-and-drop card playing (in addition to click)
- Collapsible round rules reference panel
- Dark mode toggle
- Color-blind friendly card designs option
- Keyboard shortcuts (1-9, 0 for card positions)
- Settings panel (sounds, animations, theme)

**Technical Notes:**
- Use HTML5 drag-and-drop API
- CSS custom properties for theming
- localStorage for user preferences

---

### 9. Tutorial & Onboarding
**Status:** Not Started | **Priority:** High | **Effort:** Medium

- Interactive tutorial for first-time players
- "Practice Mode" with AI to learn rules
- Tooltips explaining round rules
- Highlight valid cards for new players
- Step-by-step walkthrough of first game
- "Skip tutorial" option for experienced players

**Technical Notes:**
- Use overlay/modal system
- Track tutorial progress in localStorage
- Create simplified AI opponent for practice

---

### 10. Chat System
**Status:** Not Started | **Priority:** Medium | **Effort:** Low-Medium

- Text chat in-game
- Quick emotes/reactions (👍, 😮, 😂, 🎉, 😢)
- Predefined messages ("Nice trick!", "Good game!", "Close one!")
- Chat history viewable between rounds
- Profanity filter
- Report abusive chat

**Technical Notes:**
- Socket.io already supports real-time messaging
- Add `chatMessage` event
- Store last 50 messages per room
- Simple client-side emoji picker

---

## 📊 Statistics & History

### 11. Player Statistics Dashboard
**Status:** Not Started | **Priority:** Medium | **Effort:** Medium

**Metrics to Track:**
- Total games played
- Games won (lowest score)
- Average score per game
- Best/worst round performances
- Win rate percentage
- Personal records (lowest score in a round)
- Favorite round (best average)
- Total tricks taken
- Total penalty cards collected

**Display:**
- Personal dashboard page
- Graphs and charts
- Comparison with global averages
- Achievement progress

**Technical Notes:**
- Requires database
- Update stats after each game
- Batch calculations for efficiency

---

### 12. Game History & Replay
**Status:** Not Started | **Priority:** Low | **Effort:** High

- Save completed games to database
- Replay games card-by-card
- Pause/play/speed controls
- See each player's hand at any point
- Share game links with friends
- Export game summaries (PDF/JSON)
- Search/filter past games

**Technical Notes:**
- Store full game state history (large data)
- Compress historical data
- Implement playback system
- Consider storage costs

---

### 13. Round-by-Round Breakdown
**Status:** Not Started | **Priority:** Low | **Effort:** Medium

- Detailed scoreboard showing each trick's points
- See who took which cards in each trick
- Post-game analysis: "You could have avoided..."
- Highlight critical moments (KS played, last trick)
- Export round summaries

**Technical Notes:**
- Extend game state to track trick history
- Add analysis UI panel
- Calculate "optimal play" (advanced)

---

## 👥 Social & Multiplayer Features

### 14. Friend System
**Status:** Not Started | **Priority:** Medium | **Effort:** Medium

- Add friends by username/friend code
- Create friend-only private rooms
- Invite friends via link/email
- See online friends
- Friend activity feed
- Remove/block users

**Technical Notes:**
- Requires authentication system
- `friends` table in database
- Socket.io presence tracking
- Friend requests/acceptance flow

---

### 15. Matchmaking & Public Lobbies
**Status:** Not Started | **Priority:** High | **Effort:** High

**Features:**
- Quick Play: Auto-match with random players
- Public lobby browser (list of open games)
- Skill-based matchmaking (by average score)
- Ranked vs. Casual modes
- ELO/MMR rating system
- Match history

**Technical Notes:**
- Matchmaking queue system
- Rating calculation algorithm
- Separate ranked/casual queues
- Queue timeout handling
- Balance wait time vs. skill matching

---

### 16. Player Profiles & Customization
**Status:** Not Started | **Priority:** Medium | **Effort:** Medium

**Profile Features:**
- Choose avatar/icon (from preset library)
- Upload custom avatar (moderated)
- Display titles/badges (e.g., "Salad Master", "Heart Breaker")
- Custom card back designs (unlockable)
- Profile pages with stats
- Bio/about section
- Achievement showcase

**Customization Options:**
- Card backs (10+ designs)
- Table backgrounds
- Card face styles (modern, classic, minimal)
- Sound packs

**Technical Notes:**
- Image upload and storage
- Moderation for custom avatars
- Achievement unlock logic
- Cosmetic item database

---

### 17. Tournaments & Leagues
**Status:** Not Started | **Priority:** Low | **Effort:** Very High

**Tournament Types:**
- Single-elimination brackets
- Swiss-system tournaments
- Round-robin leagues
- Daily/weekly/monthly events
- Prize pools (virtual or real)

**League System:**
- Divisions (Bronze, Silver, Gold, Platinum)
- Seasonal rankings
- Promotion/relegation
- Season rewards

**Technical Notes:**
- Complex tournament bracket management
- Scheduling system
- Tournament admin tools
- Results tracking and verification
- Major feature requiring significant development

---

## 🛠️ Technical Improvements

### 18. Database Integration
**Status:** Not Started | **Priority:** High | **Effort:** Medium-High

**Current:** In-memory state with file-based snapshots
**Proposed:** PostgreSQL or MongoDB

**Data to Store:**
- User accounts and profiles
- Game history
- Player statistics
- Room state (persistent across restarts)
- Chat history
- Friend relationships
- Achievements

**Schema Design:**
- `users` table (id, username, email, password_hash, created_at)
- `games` table (id, room_code, players, final_scores, created_at)
- `game_rounds` table (game_id, round_number, scores, tricks)
- `friendships` table (user_id, friend_id, status)
- `statistics` table (user_id, games_played, wins, avg_score)

**Technical Notes:**
- Use Prisma or TypeORM for type-safe queries
- Implement database migrations
- Connection pooling
- Backup strategy

---

### 19. Authentication System
**Status:** Not Started | **Priority:** High | **Effort:** Medium

**Authentication Methods:**
- Email/password registration
- OAuth providers (Google, GitHub, Discord)
- Guest play still available (no account required)
- Password recovery via email

**Security:**
- bcrypt for password hashing
- JWT tokens for session management
- CSRF protection
- Rate limiting on login attempts
- Email verification

**Technical Notes:**
- Use Passport.js or similar
- Secure HTTP-only cookies
- Implement refresh token rotation
- Consider using Auth0 or Clerk for faster implementation

---

### 20. Admin Panel
**Status:** Not Started | **Priority:** Medium | **Effort:** Medium

**Features:**
- Dashboard with server metrics
- Active rooms/players list
- View server stats (uptime, memory, active connections)
- Player management (ban/kick, view profiles)
- Force-end problematic games
- View logs and errors
- Game statistics (games per day, popular times)
- Moderation tools (review chat reports)

**Technical Notes:**
- Separate admin UI (React/Vue app)
- Role-based access control
- Real-time metrics dashboard
- Secure admin authentication

---

### 21. Rate Limiting & Anti-Cheat
**Status:** Not Started | **Priority:** Medium | **Effort:** Medium

**Rate Limiting:**
- Prevent card-play spam (max 1 play per second)
- Room creation limits (5 per hour per IP)
- Chat message rate limiting
- Use express-rate-limit middleware

**Anti-Cheat Measures:**
- Detect disconnection abuse (intentional DC to avoid losses)
- Validate all moves server-side (already done)
- Track suspicious patterns
- IP-based restrictions
- CAPTCHA for account creation
- Report system for cheating/griefing

**Technical Notes:**
- Log suspicious activity
- Automated ban system for repeat offenders
- Appeal process

---

### 22. Mobile App Wrapper
**Status:** Not Started | **Priority:** Low | **Effort:** Medium-High

**Options:**
- Capacitor (recommended - web-based)
- React Native
- Progressive Web App (PWA) - easiest option

**Mobile-Specific Features:**
- Push notifications for turn reminders
- Better mobile gestures (swipe to play card)
- Offline mode with AI opponents
- Native share functionality
- Haptic feedback
- App store presence (iOS App Store, Google Play)

**Technical Notes:**
- PWA is quickest path (just add manifest.json and service worker)
- Capacitor wraps existing web app
- App store submission process
- Handle app store review requirements

---

### 23. Improved Error Handling
**Status:** Not Started | **Priority:** Medium | **Effort:** Low-Medium

**Server-Side:**
- Structured logging (Winston or Pino)
- Error reporting service (Sentry, Rollbar)
- Detailed error logs with context
- Error categorization (network, game logic, validation)

**Client-Side:**
- Graceful degradation when WebSocket fails
- Automatic retry logic for failed connections
- User-friendly error messages
- Connection status indicator
- Reconnection progress

**Monitoring:**
- Error rate alerts
- Error categorization dashboard
- Stack trace analysis

**Technical Notes:**
- Integrate Sentry for both client and server
- Create error boundary components
- Implement exponential backoff for retries

---

## 🚀 Performance & Scalability

### 24. Redis for State Management
**Status:** Not Started | **Priority:** Medium | **Effort:** High

**Current:** In-memory state (single server)
**Proposed:** Redis for distributed state

**Benefits:**
- Enables horizontal scaling across multiple servers
- Session persistence across server restarts
- Pub/sub for cross-server events
- Better performance for concurrent games
- Centralized state management

**Use Cases:**
- Room state storage
- Session management
- Real-time leaderboards
- Pub/sub for game events across servers

**Technical Notes:**
- Use ioredis client
- Implement Redis Streams for event log
- Set up Redis Cluster for high availability
- Data serialization strategy

---

### 25. Load Balancing
**Status:** Not Started | **Priority:** Low | **Effort:** High

**Requirements:**
- Support multiple server instances
- Sticky sessions for WebSocket connections
- Auto-scaling based on player count
- Health checks
- Graceful server shutdown

**Implementation:**
- NGINX or HAProxy for load balancing
- Session affinity (sticky sessions) for WebSockets
- Socket.io Redis adapter for cross-server communication
- Kubernetes for orchestration (advanced)

**Technical Notes:**
- Requires Redis for shared state
- Configure Socket.io with Redis adapter
- Implement health check endpoint (already exists at `/health`)

---

### 26. CDN for Static Assets
**Status:** Not Started | **Priority:** Low | **Effort:** Low

- Serve CSS/JS/images from CDN (Cloudflare, AWS CloudFront)
- Reduce server load
- Faster global loading times
- Automatic caching and compression

**Implementation:**
- Upload static assets to CDN
- Update HTML to reference CDN URLs
- Set proper cache headers
- Invalidation strategy for updates

**Technical Notes:**
- Easy win for performance
- Low cost (or free with Cloudflare)

---

### 27. Compression & Optimization
**Status:** Not Started | **Priority:** Medium | **Effort:** Low-Medium

**Asset Optimization:**
- Minify CSS/JS (use Terser, cssnano)
- Compress WebSocket messages (gzip)
- Use WebP images for graphics
- Lazy-load non-critical resources
- Code splitting for client.js

**Network Optimization:**
- Enable gzip/brotli compression on server
- HTTP/2 server push
- Reduce payload sizes (filter unnecessary data)
- Batch updates when possible

**Technical Notes:**
- Add build step for minification
- Use webpack or esbuild for bundling
- Measure impact with Lighthouse

---

## 💰 Monetization (Optional)

### 28. Premium Features
**Status:** Not Started | **Priority:** Low | **Effort:** Medium

**Freemium Model:**

**Free Tier:**
- Full game access
- Basic statistics
- 3 games per day limit (or unlimited)

**Premium Tier ($3-5/month):**
- Ad-free experience
- Unlimited games
- Custom card designs (exclusive)
- Priority matchmaking (faster queues)
- Extra statistics and analytics
- Game history access (unlimited)
- Exclusive badges/titles
- Early access to new features

**Technical Notes:**
- Integrate payment processor (Stripe, Paddle)
- Subscription management
- Feature flags for premium users
- Trial period (7-14 days)

---

### 29. Cosmetic Microtransactions
**Status:** Not Started | **Priority:** Low | **Effort:** Medium

**Purchasable Items:**
- Card skins/themes (seasonal, themed)
- Animated card backs
- Table backgrounds
- Victory animations
- Custom avatars
- Sound packs

**Pricing:**
- Individual items: $0.99 - $2.99
- Bundles: $4.99 - $9.99
- Season pass: $9.99 (all items for 3 months)

**Alternative: Support-Based:**
- "Buy me a coffee" button
- Donations with cosmetic rewards
- Supporter badge

**Technical Notes:**
- Virtual currency system (optional)
- Item inventory database
- Equip/unequip system
- Consider ethical monetization (no pay-to-win)

---

## 🔧 Development & Operations

### 30. CI/CD Pipeline
**Status:** Not Started | **Priority:** High | **Effort:** Medium

**GitHub Actions Workflows:**

**On Pull Request:**
- Run linter (eslint)
- Run tests (jest)
- Type check (tsc --noEmit)
- Build verification
- Code coverage report

**On Merge to Main:**
- Run full test suite
- Build production bundle
- Auto-deploy to staging environment
- Run smoke tests
- Deploy to production (with approval)

**Scheduled:**
- Dependency updates (Dependabot)
- Security scanning (npm audit)
- Performance benchmarks

**Technical Notes:**
- Create `.github/workflows/` directory
- Configure deployment secrets
- Set up staging environment
- Implement rollback strategy

---

### 31. Monitoring & Analytics
**Status:** Not Started | **Priority:** Medium | **Effort:** Medium

**Server Monitoring:**
- CPU, memory, disk usage
- Request latency
- WebSocket connection count
- Active rooms/players
- Error rates
- Uptime monitoring

**Application Analytics:**
- Player engagement metrics (DAU, MAU, retention)
- Game completion rates
- Average game duration
- Popular times/days
- Drop-off points
- Feature usage

**Tools:**
- Prometheus + Grafana for metrics
- Google Analytics or Plausible for web analytics
- Custom event tracking
- Alerting (PagerDuty, Slack)

**Technical Notes:**
- Instrument code with metrics
- Create dashboards
- Set up alerts for critical metrics

---

### 32. Documentation Improvements
**Status:** Not Started | **Priority:** Medium | **Effort:** Low-Medium

**Technical Documentation:**
- API documentation (Swagger/OpenAPI for REST endpoints)
- Socket.io event documentation
- Architecture diagrams (system design, data flow)
- Database schema diagrams
- Deployment guide

**Developer Documentation:**
- Contributing guidelines (CONTRIBUTING.md)
- Code style guide
- Development setup guide
- Testing strategy documentation
- Release process

**User Documentation:**
- FAQ page
- Game rules detailed guide
- Troubleshooting guide
- Privacy policy
- Terms of service

**Technical Notes:**
- Use tools like Docusaurus or GitBook
- Generate API docs from code (TSDoc)
- Keep docs in sync with code

---

### 33. Internationalization (i18n)
**Status:** Not Started | **Priority:** Low | **Effort:** Medium-High

**Languages to Support:**
- English (default)
- French
- Spanish
- German
- Portuguese
- Mandarin Chinese

**What to Translate:**
- UI text (buttons, labels, messages)
- Game rules
- Error messages
- Email notifications
- Card names (optional - can use symbols)

**Technical Notes:**
- Use i18next or similar library
- Extract all strings to translation files
- Language switcher in UI
- Detect browser language
- RTL support for Arabic, Hebrew (future)

---

## 🎯 Quick Wins (High Impact, Low Effort)

These features can be implemented quickly and provide immediate value:

### 1. Sound Effects ⚡
**Effort:** Low | **Impact:** High | **Time:** 1-2 days

- Add ~10 sound files
- Play on card events
- Add mute toggle
- **Why:** Dramatically improves game feel

---

### 2. Dark Mode 🌙
**Effort:** Low | **Impact:** Medium | **Time:** 1 day

- CSS-only with custom properties
- Toggle in UI
- Save preference to localStorage
- **Why:** Popular user request, accessibility

---

### 3. Keyboard Shortcuts ⌨️
**Effort:** Low | **Impact:** Medium | **Time:** 1 day

- Already have Enter key support
- Add number keys 1-9, 0 for card positions
- Space for "Next Round"
- **Why:** Power user feature, efficiency

---

### 4. Round Rules Reference 📖
**Effort:** Low | **Impact:** High | **Time:** 1 day

- Collapsible panel with current round rules
- Always visible during game
- Detailed scoring breakdown
- **Why:** Helps new players, reduces confusion

---

### 5. Better Mobile Touch Handling 📱
**Effort:** Low | **Impact:** Medium | **Time:** 1-2 days

- Improve touch targets (larger tap areas)
- Prevent double-tap zoom
- Swipe gestures (optional)
- **Why:** Many users play on mobile

---

### 6. Player Avatars 👤
**Effort:** Low | **Impact:** Medium | **Time:** 1 day

- Use DiceBear API or UI Avatars
- Generate from player name
- Add to player list
- **Why:** Visual improvement, personality

---

### 7. Chat System 💬
**Effort:** Low-Medium | **Impact:** Medium | **Time:** 2-3 days

- Socket.io already handles real-time
- Simple text input + message list
- Emoji support
- **Why:** Social engagement, player interaction

---

### 8. Basic Statistics 📊
**Effort:** Low | **Impact:** Medium | **Time:** 2-3 days

- Track wins/losses in localStorage (no DB needed)
- Display on game over screen
- Simple stat cards
- **Why:** Player retention, achievement feeling

---

### 9. Card Hover Preview 🔍
**Effort:** Low | **Impact:** Medium | **Time:** 1 day

- Enlarge card on hover
- Show card details
- Smooth animation
- **Why:** Better UX, especially on desktop

---

### 10. Connection Status Indicator 🔌
**Effort:** Low | **Impact:** High | **Time:** 1 day

- Show online/offline status
- Reconnecting indicator
- Network latency (ping)
- **Why:** User awareness, debug connection issues

---

## Implementation Priority Matrix

```
High Impact, Low Effort (DO FIRST):
├── Sound effects
├── Round rules reference
├── Connection status indicator
└── Basic statistics

High Impact, Medium Effort (DO NEXT):
├── Animations & visual feedback
├── Tutorial & onboarding
├── Persistent sessions & reconnection
└── Matchmaking & public lobbies

High Impact, High Effort (STRATEGIC):
├── Database integration
├── Authentication system
├── AI players
└── Mobile app

Low Priority (NICE TO HAVE):
├── Tournaments
├── Game replay
├── Internationalization
└── Monetization features
```

---

## Success Metrics

Track these metrics to measure feature success:

**Engagement:**
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- Average session duration
- Games per user per day
- Retention (Day 1, Day 7, Day 30)

**Performance:**
- Page load time
- Time to first game
- WebSocket latency
- Error rate
- Crash rate

**Growth:**
- New user signups
- Referral rate
- Viral coefficient
- App store ratings (if mobile)

**Business (if monetizing):**
- Conversion rate (free to paid)
- Monthly Recurring Revenue (MRR)
- Customer Lifetime Value (LTV)
- Churn rate

---

## Notes

- This roadmap is a living document and should be updated as priorities change
- Community feedback should drive prioritization
- Always maintain backward compatibility when possible
- Focus on core game experience before adding complex features
- Measure impact of each feature after launch

---

**Last Updated:** 2025-11-17
**Version:** 1.0
