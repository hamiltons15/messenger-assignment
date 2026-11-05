# CPS 490 IA-06 Messenger

Local registered-user messaging MVP: browser registration/login/logout, username-based direct and group creation, persistent ordered history, server-enforced membership, and Socket.IO live delivery/recovery. Deadline: November 2, 2026.

## Prerequisites

- Node.js **24 LTS** and npm (verified with Node 24.22.0 / npm 11.19.1).
- Docker Engine with Compose v2 for local MongoDB (`mongo:7.0`); Docker must be usable by your Ubuntu account.
- Git and a current browser. Python 3 and Firefox are needed only for the optional automated browser demonstration.

## Install and configure

From the repository root:

```bash
npm ci
npm run setup
docker compose up -d mongodb
docker compose ps
```

Create `server/.env` safely. This command generates a random signing secret, prints no secret, and refuses to overwrite an existing file:

```bash
node -e 'const fs=require("node:fs"),crypto=require("node:crypto"); const example=fs.readFileSync(".env.example","utf8"); fs.writeFileSync("server/.env",example.replace(/^JWT_SECRET=$/m,"JWT_SECRET="+crypto.randomBytes(32).toString("hex")),{flag:"wx",mode:0o600}); console.log("Created server/.env; secret not displayed.");'
```

If `server/.env` exists, keep it and check its settings privately. `PORT=3000`, `MONGO_URI=mongodb://127.0.0.1:27017/messenger`, and a **64-character hexadecimal JWT_SECRET** are required. The root and server examples contain no usable secret. Never add real environment files to Git.

## Run

Keep these running in separate terminals, both from the root:

```bash
npm run start:server
```

```bash
npm run start:client
```

Open **http://127.0.0.1:5173** in your browser. Follow the account creation instructions below before starting a conversation.

### Create test accounts

1. Use the registration form to create an account with a unique username and password.
2. Log in using the credentials you registered.
3. For multi user testing, create at least three accounts, such as `alice`, `bob`, and `carol`. Use separate browser profiles or private browsing sessions so multiple users can remain logged in independently.
4. Use these accounts to verify direct messaging, group conversations, live message delivery, and persistent message history.

Accounts are stored in MongoDB, and passwords are stored as bcrypt hashes rather than plaintext. The application does not include predefined test accounts. Do not commit actual account credentials or passwords to the repository.

### Using Messenger

To start a direct conversation, enter one other registered username. For a group, enter at least two other registered usernames separated by commas; your account is included automatically. An optional group name helps identify it.

Select a conversation and send messages. Connected recipients receive a transient new-message notice; no persistent unread counts are kept. Connected participants automatically receive new-conversation notifications through Socket.IO, which refresh their authorized conversation lists. **Refresh conversations** remains available as a manual fallback. Direct duplicates open the existing conversation when its ID is returned, or remain accessible from the refreshed list.

History is displayed oldest first with local timestamps; **Load older messages** uses server cursors. **Refresh history** checks saved state after uncertain delivery. Logout discards the in-memory JWT and closes the socket; a page refresh requires login again. A JWT expires after eight hours. Client logout does not revoke a copied JWT on the server.

## Tests and build

```bash
npm test
npm run test:integration
npm run lint
npm run build
```

- `npm test`: backend unit tests and client HTTP/reconciliation helper tests; no database or real secret required.
- `test:integration`: starts an isolated backend on a free port and creates a **new** `messenger_ia06_test_*` database on local MongoDB. It provisions its own accounts, verifies HTTP/Socket.IO operations and failures, restarts only its own backend, and retains test records. It never drops a database, deletes development records, or uses `server/.env` configuration values. A generated process-local signing key overrides local values.
- If MongoDB uses a different local port: `MESSENGER_TEST_MONGO_PORT=27018 npm run test:integration`.
- Historical fixture-dependent TP7 scripts remain in place, but are excluded from the default integration command. `npm run test:legacy --prefix server` is opt-in, requires the original accounts/IDs and `TP7_TEST_PASSWORD`, and **writes into those conversations**. It is unnecessary for release verification.

Actual Firefox acceptance demonstration (optional verification tooling, no added dependency):

```bash
npm run test:browser
```

This starts isolated app processes/ports, four Firefox profiles in ignored `.release-check/`, and a fresh `messenger_ia06_browser_*` database. It checks real rendered UI behavior, including all five assignment scenarios. Profiles may contain browser data: keep them local. See [verification](docs/verification.md) for exact manual steps, observed results, and distinctions between test types.

## Local release procedure

```bash
npm run test:release
docker compose config --quiet
git diff --check
git status --short
```

The release checker copies tracked and nonignored new source files into a fresh ignored `.release-check/source_*` directory, installs from all three lockfiles, tests, lints, builds, and smoke-tests the built client with an isolated backend/database. It exports current **uncommitted** source intentionally; it creates no Git repository and performs no commit/push. It requires npm registry access for uncached packages and existing local MongoDB. Retained test databases and ignored verification output are never submitted.

For a local built-client run after `npm run build`, keep the backend running and use:

```bash
npm run preview --prefix client
```

Open http://127.0.0.1:4173. Both development and preview forward `/api` and `/socket.io` to the backend. Preview is a local build check, not public production hosting. Override the backend target if needed with `MESSENGER_API_PORT=3001`; the dev port can be changed with `MESSENGER_CLIENT_PORT=5174`.

Review the intended diff, configuration examples, test evidence, requirements/diagrams, and ignored-file rules. The original submission deadline was November 2, 2026. The repository owner must review, stage, commit, and push any subsequent changes to the required repositories. After that, repeat setup/checks from that actual final clone. This implementation work does not automatically submit anything.

## Troubleshooting

| Symptom | Check |
|---|---|
| JWT_SECRET startup error | Generate 32 random bytes as 64 hex characters; use `server/.env`; do not use the empty example value. |
| PORT/MONGO_URI missing | Configure `server/.env`; root scripts run the backend in `server/`. |
| MongoDB connection failure | Check Compose status, local port, URI, and Docker permission. Existing DB services must not be reset. |
| Docker socket permission denied | Ask the machine owner to provide normal Docker access; no sudo, group changes, or settings changes are performed by verification tools. |
| EADDRINUSE / Vite occupied port | Identify your already-running process; use free app ports and matching `MESSENGER_API_PORT` rather than stopping unrelated processes. Vite fails instead of silently changing ports. |
| Backend unavailable / unreadable response | Check backend logs and proxy target. Delivery may be unconfirmed; inspect history before retrying. |
| Session expired | Log in again. Socket expiry and authenticated HTTP 401 end the browser session. |
| Missing conversation | Refresh the list, check spelling/registration of invitees, and confirm membership. |
| Integration startup timeout | Start local MongoDB first; check `MESSENGER_TEST_MONGO_PORT`; tests never start/stop your MongoDB service. |
| Firefox test startup failure | Check installed Firefox and local execution permissions; use the manual acceptance steps if headless Firefox is unavailable. |

Do not delete volumes or reset databases to troubleshoot. No `docker compose down -v` is needed.

## Scope and limitations

The MVP retains the established API for sender-only message edits/soft deletion and creator-only group membership management. Browser controls for these operations, profile editing, and persistent unread tracking were deferred from the implemented MVP scope and are not claimed as verified browser features. Current account identification and live messaging remain implemented. See [requirements](docs/requirements.md) and [implementation report](docs/implementation-report.md).

No attachments, search, read receipts, public deployment, or refresh-token service is included. A lost response does not establish whether a write committed; there are no automatic write retries or server idempotency keys. History is rescanned after authorized joins/reconnects for correctness; this is suitable for the small MVP, not optimized for very large histories. Membership removal prevents subsequent protected access/events, but cannot erase content already seen. Distributed/concurrent membership-change races and every possible mid-write MongoDB outage are not claimed solved.

## Dependencies and evidence

Observed completion checks (October 31): 29 backend unit tests, 5 client helper tests, 19 isolated integration checks, all five actual Firefox acceptance scenarios, lint, build, and fresh-source local startup passed.

Independent release verification (November 1): `npm run test:release` passed in the Ubuntu development environment, including 53 automated checks (29 backend, 5 frontend, 19 integration), ESLint, production build, Docker Compose configuration validation, and built-client HTTP/API/Socket.IO smoke checks. The existing MongoDB 7.0 container was independently confirmed running.

Fresh Docker provisioning was not performed, and final committed-clone verification remains outstanding. Commit `261e429` was pushed to both the personal GitHub repository and the course repository. On November 4, all 54 automated tests passed (29 backend, 5 frontend, 20 integration), and the frontend production build succeeded. On November 5, `npm run test:release` passed with all 54 automated tests, ESLint, production build, and built-client HTTP/API/Socket.IO smoke checks. See `docs/verification.md` for detailed evidence and limitations.

Engineering artifacts: [SOW](docs/statement-of-work.md), [requirements](docs/requirements.md), [analysis](docs/analysis.md), [ethics](docs/ethics-reflection.md), [traceability](docs/implementation-report.md), [verification](docs/verification.md), and [diagrams](docs/diagrams/).
