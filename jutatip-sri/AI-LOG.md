# AI Development Log - Game Collection API

## 1. API Design
Design a REST API for Game Collection with full CRUD operations.
Fields: id, title, genre, platform, store, status, priority, rating, review, image_url, played_hours, started_at, finished_at, created_at, updated_at.
Support filtering by status, genre, platform, store, priority and search by title.

### AI Suggestion
The AI suggested using Hono framework with Cloudflare Workers and D1 database. It proposed:
- 6 endpoints: GET /api/games, GET /api/games/:id, POST /api/games, PATCH /api/games/:id, DELETE /api/games/:id, GET /api/health
- Parameterized queries for SQL injection prevention
- Status validation (want_to_play, playing, completed, dropped)
- Rating validation (1-5)
- Priority validation (low, medium, high)

### My Decision
Accepted all endpoints and added extra features:
- Store/Launcher field for platform tracking
- started_at and finished_at for game timeline
- Priority field (low, medium, high)
- Filter by status, genre, platform, store, priority
- Search by title

### Why
The API design followed REST best practices and covered all CRUD requirements. Additional fields like store, dates, and priority make the application more useful for real-world game collection management.

---

## 2. Implementation

### Task
- Implement POST /api/games with validation

Help me implement POST /api/games endpoint with validation.

- title, genre, platform are required

- status must be: want_to_play, playing, completed, dropped

- priority must be: low, medium, high

- rating must be 1-5

- Use parameterized SQL with prepare() and bind()

### What AI Generated
Complete code with:
- Request body validation
- Status and priority validation
- Rating validation (1-5)
- Played_hours validation (>= 0)
- Parameterized SQL INSERT statement
- 201 Created response with game data
- 400 Bad Request for validation errors

### What I Changed
- Added store field support
- Added started_at and finished_at support
- Improved error messages
- Added CHECK constraints in database schema
- Added default values (status: want_to_play, priority: medium)

---

## 3. Debugging

### Problem 1: D1 Remote Migration Error
**Error:** `duplicate column name: started_at: SQLITE_ERROR [code: 7500]`

**AI Diagnosis:** Migration 0003_add_dates.sql tried to add columns that already existed in Remote D1

**Actual Root Cause:** We added `started_at` and `finished_at` manually using ALTER TABLE commands earlier, but the migration file was still trying to add them.

**Fix:** Removed migration file `0003_add_dates.sql` and applied only migration 0004_add_priority.sql

---

### Problem 2: Worker Login in Codespace
**Error:** `ERR_CONNECTION_REFUSED` when trying to login via browser

**AI Diagnosis:** Codespace environment has no GUI, so browser-based OAuth flow doesn't work

**Actual Root Cause:** Missing GUI environment for browser login

**Fix:** Used `npx wrangler login --device` to login via Device Authorization Grant flow

---

### Problem 3: API 500 Error on Production
**Error:** 500 Internal Server Error, "Internal Server Error" not valid JSON

**AI Diagnosis:** Database missing columns or migration not applied

**Actual Root Cause:** Remote D1 didn't have `started_at` and `finished_at` columns

**Fix:** Added columns manually using `ALTER TABLE` commands and redeployed

---

### Problem 4: URL Format Issue
**Error:** Worker URL was `jutatip-sri.jutatip-sri.workers.dev` (duplicate name)

**AI Diagnosis:** Worker name and account subdomain both were `jutatip-sri`

**Actual Root Cause:** Same name used for both Worker and Cloudflare account

**Fix:** Changed Worker name in `wrangler.json` from `jutatip-sri` to `game-api`

---

### Problem 5: Dev Server Not Running
**Error:** `curl: (7) Failed to connect to localhost port 5173`

**AI Diagnosis:** Dev server wasn't running

**Actual Root Cause:** Forgot to run `npm run dev` before testing

**Fix:** Ran `npm run dev` in separate terminal and kept it running

---

### Problem 6: Missing Priority Column
**Error:** 500 Internal Server Error when creating game with priority

**AI Diagnosis:** Remote D1 missing `priority` column

**Actual Root Cause:** Migration 0004 didn't apply to Remote D1

**Fix:** Applied migration 0004 to Remote D1 and verified with `PRAGMA table_info`

---

### Problem 7: Syntax Error in Command
**Error:** `Unknown arguments: devicenpx, login`

**AI Diagnosis:** Typed command incorrectly

**Actual Root Cause:** Typed `npx wrangler login --devicenpx wrangler login --device` instead of `npx wrangler login --device`

**Fix:** Used correct command `npx wrangler login --device`

---

## 4. Testing

### Tests Suggested by AI
1. POST with valid data → 201 Created
2. POST without title → 400 Bad Request
3. POST with empty title → 400 Bad Request
4. POST with invalid status → 400 Bad Request
5. POST with invalid priority → 400 Bad Request
6. POST with rating > 5 → 400 Bad Request
7. GET all games → 200 OK with data array
8. GET by ID → 200 OK with game data
9. GET non-existent ID → 404 Not Found
10. PATCH update status → 200 OK
11. PATCH update priority → 200 OK
12. DELETE existing game → 204 No Content
13. DELETE non-existent game → 404 Not Found
14. Filter by status → 200 OK with filtered results
15. Filter by priority → 200 OK with filtered results
16. Search by title → 200 OK with matching results

### Tests I Actually Ran
| Test | Method | Endpoint | Result |
|---|---|---|---|
| Health check | GET | /api/health | ✅ 200 OK |
| Create game with valid data | POST | /api/games | ✅ 201 Created |
| Create game without title | POST | /api/games | ✅ 400 Bad Request |
| Get all games | GET | /api/games | ✅ 200 OK |
| Get game by ID | GET | /api/games/:id | ✅ 200 OK |
| Get non-existent game | GET | /api/games/xxx | ✅ 404 Not Found |
| Filter by status=playing | GET | /api/games?status=playing | ✅ 200 OK |
| Filter by priority=high | GET | /api/games?priority=high | ✅ 200 OK |
| Search by q=Zelda | GET | /api/games?q=Zelda | ✅ 200 OK |
| Update status | PATCH | /api/games/:id | ✅ 200 OK |
| Update priority | PATCH | /api/games/:id | ✅ 200 OK |
| Delete game | DELETE | /api/games/:id | ✅ 204 No Content |
| Filter by store=Steam | GET | /api/games?store=Steam | ✅ 200 OK |
| Filter by genre=RPG | GET | /api/games?genre=RPG | ✅ 200 OK |

---

## 5. Reflection

### What did AI do well?
1. **API Design**: Suggested RESTful endpoints that follow best practices
2. **Security**: Recommended parameterized queries (prepare + bind) to prevent SQL injection
3. **Validation**: Identified all required validations (status, priority, rating, hours)
4. **Debugging**: Helped diagnose production issues quickly
5. **Code Structure**: Provided clean, well-organized code with clear comments
6. **Responsive Design**: Suggested media queries for mobile responsiveness
7. **Error Handling**: Recommended proper HTTP status codes (400, 404, 201, 204)

### What did AI get wrong?
1. **Context Understanding**: Sometimes suggested changes that conflicted with existing code structure
2. **Migration Management**: Didn't warn about duplicate columns when adding columns manually
3. **Edge Cases**: Sometimes missed edge cases like empty string validation
4. **Code Duplication**: Generated similar code in multiple places instead of suggesting reusable functions
5. **Command Syntax**: Could have been clearer about exact command syntax for login

### What engineering decisions did I make myself?
1. **Project Choice**: Chose Game Collection over Task Manager for uniqueness
2. **UI Design**: Designed "Cartridge Shelf" theme with dark console palette
3. **Additional Fields**: Decided to add store, started_at, finished_at, and priority fields
4. **Worker Name**: Changed Worker name from `jutatip-sri` to `game-api` for cleaner URL
5. **Edit Modal**: Implemented full edit modal instead of inline editing for better UX
6. **Responsive Design**: Added specific breakpoints for tablet and mobile
7. **Priority System**: Decided to implement priority with default "medium"
8. **Date Handling**: Made started_at and finished_at optional (nullable)
9. **Worker URL**: Kept using `game-api.jutatip-sri.workers.dev` instead of original

---

## 6. Key Lessons Learned

1. **AI is a Tool, Not a Replacement**: Always review and understand code before using it
2. **Test Locally First**: Local testing catches issues before production deployment
3. **Migration Management**: Keep track of what's been applied to Remote D1
4. **Environment Differences**: Local and Remote D1 are separate - must migrate both
5. **Debugging Approach**: OBSERVE → UNDERSTAND → ASK AI → CHANGE → TEST → VERIFY
6. **Value of Validation**: Good validation prevents many production errors
7. **Documentation**: AI-LOG.md helps track decisions and learning
8. **Read Error Messages Carefully**: Most errors contain the solution (e.g., duplicate column name)
9. **Check Schema First**: When getting 500 errors, verify database schema matches code

---

## 7. Production URL
https://game-api.jutatip-sri.workers.dev

---

## 8. Features Implemented

| Feature | Status |
|---|---|
| CRUD Operations | ✅ |
| Filter by Status | ✅ |
| Filter by Priority | ✅ |
| Filter by Genre | ✅ |
| Filter by Platform | ✅ |
| Filter by Store | ✅ |
| Search by Title | ✅ |
| Store/Launcher Field | ✅ |
| Priority (Low/Medium/High) | ✅ |
| Started At / Finished At | ✅ |
| Rating (1-5) | ✅ |
| Review | ✅ |
| Played Hours | ✅ |
| Edit Modal | ✅ |
| Responsive UI | ✅ |
| Production Deployment | ✅ |
| Health Check | ✅ |
| Error Handling | ✅ |
| Input Validation | ✅ |

---

## 9. Database Schema

```sql
CREATE TABLE games (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  genre TEXT NOT NULL,
  platform TEXT NOT NULL,
  store TEXT,
  status TEXT NOT NULL DEFAULT 'want_to_play'
    CHECK(status IN ('want_to_play', 'playing', 'completed', 'dropped')),
  priority TEXT DEFAULT 'medium'
    CHECK(priority IN ('low', 'medium', 'high')),
  rating INTEGER CHECK(rating >= 1 AND rating <= 5),
  review TEXT,
  image_url TEXT,
  played_hours INTEGER DEFAULT 0,
  started_at TEXT,
  finished_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_genre ON games(genre);
CREATE INDEX idx_games_platform ON games(platform);
CREATE INDEX idx_games_priority ON games(priority);