# Audit Note — AIMentalHealthCompanion

Source audit: `_AUDIT/reports/batch_05.md` § 21 (audit reported 0 `/ai/*` endpoints)

## Original audit recommendations

### Missing AI endpoints
- `/ai/journal-sentiment`
- `/ai/crisis-assessment`
- `/ai/coping-recommendation`
- `/ai/therapist-match`
- `/ai/sleep-advisor`
- `/ai/mood-trend-analysis`

### Missing non-AI features
- Secure therapist messaging (HIPAA-compliant)
- Video therapy capability
- Medication tracking
- Crisis text line integration (SMS support)
- Family/support network involvement
- Smartwatch integration
- Data export for therapist sharing

### Custom feature suggestions
- Agentic mental health companion
- Streaming mood anomaly detection
- Personalized CBT/DBT delivery
- Voice-based therapy access
- Peer support orchestration
- Integrated therapy ecosystem

## Implemented in this pass
Created `server/routes/ai.js` (ESM, matches project style) and mounted at `/api/ai` in `server/index.js`. Adds three formal `/ai/*` endpoints called out by the audit:

1. **POST `/api/ai/journal-sentiment`** — sentiment + emotions + themes from a journal entry; layers in `detectCrisis` keyword check + `CRISIS_RESOURCES` from `utils/ai.js`.
2. **POST `/api/ai/crisis-assessment`** — risk level + score + warning signs + escalation flag; merges keyword and model judgement; always returns crisis resources when escalation is recommended.
3. **POST `/api/ai/coping-recommendation`** — pulls coping strategy catalog from Postgres if available; returns recommendations, immediate action, longer-term practice.

All three reuse `getAIResponse`, `parseAIJson`, `detectCrisis`, `CRISIS_RESOURCES` from `utils/ai.js` and the existing `aiLimiter` middleware. Verified with `node --check`.

## Backlog (priority order)

### Mechanical
- `/ai/therapist-match` (uses `therapists` table — straightforward)
- `/ai/sleep-advisor` (uses sleep tracking data)
- `/ai/mood-trend-analysis` (uses moods table — small SQL aggregate)

### Needs creds / external SDK
- HIPAA-compliant messaging (specialty PaaS)
- Crisis text line SMS (Twilio + 988 referral routing — clinical sign-off needed)
- Smartwatch integration (HealthKit, Fitbit)
- Voice-based therapy (ASR + TTS)

### Needs product decision
- Video therapy (provider model: zoom/SDK vs in-house)
- Medication tracking (regulated data — DEA / FDA implications)
- Family/support network (consent model, sharing scope)
- Data export for therapist sharing (HL7 FHIR vs PDF)

## Apply pass 4 (mechanical backlog)

Implemented all three mechanical `/ai/*` endpoints called out in earlier-pass backlog inside `server/routes/ai.js`:

1. `POST /api/ai/therapist-match` — ranks `therapists` table rows for fit (preferences / concerns / modality / location).
2. `POST /api/ai/sleep-advisor` — CBT-I-grounded sleep recommendations from logs / routine / goals.
3. `POST /api/ai/mood-trend-analysis` — aggregates `moods` rows (last N days) and lets the model identify trends, triggers, and recommendations.

Each endpoint short-circuits with HTTP 503 when `OPENROUTER_API_KEY` is missing, reuses `getAIResponse` + `parseAIJson` + `aiLimiter` and queries the existing `therapists` / `moods` tables (graceful fallback if tables aren't present).

Frontend: `client/src/pages/AIToolsPage.jsx` extended with three new tool cards (Users / Moon / TrendingUp icons) wired to the new endpoints; lucide imports updated. Sidebar / App.jsx routing unchanged (page already at `/ai-tools`).

Smoke test: `node --check` PASS for `server/routes/ai.js`; `esbuild` PASS for `AIToolsPage.jsx`. Live HTTP smoke skipped (PostgreSQL dependency).

Deferred backlog (unchanged): HIPAA messaging, Twilio crisis SMS, smartwatch ingestion, voice therapy (NEEDS-CREDS); video therapy provider, medication tracking, family/support sharing, FHIR export (NEEDS-PRODUCT-DECISION).

## Apply pass 3 (frontend)

FE already wired. `client/src/pages/AIToolsPage.jsx` already exposes `/ai/journal-sentiment`, `/ai/crisis-assessment`, and `/ai/coping-recommendation` (the three endpoints added in pass 2). It is routed in `client/src/App.jsx` at `/ai-tools` behind `ProtectedRoute`. No FE changes this pass.

## Apply pass 5 (all backlog)

10 features added.

### NEEDS-CREDS (503 stubs)
- Twilio crisis SMS — `POST /api/integrations/sms/twilio`. Env: `TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER`.
- Apple HealthKit import — `POST /api/integrations/healthkit/import`. Env: `HEALTHKIT_TEAM_ID, HEALTHKIT_KEY_ID, HEALTHKIT_PRIVATE_KEY`.
- Fitbit import — `POST /api/integrations/fitbit/import`. Env: `FITBIT_CLIENT_ID, FITBIT_CLIENT_SECRET`.
- Voice therapy ASR — `POST /api/integrations/voice/transcribe`. Env: `DEEPGRAM_API_KEY`.
- Zoom video session — `POST /api/integrations/zoom/session`. Env: `ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET`.

### NEEDS-PRODUCT-DECISION
- Medication tracking — patient self-report only (no e-prescribing). `medications` + `medication_log` tables (additive). Real prescribing via Surescripts gated for future creds.
- Family/support network — explicit consent, default scope `crisis-alerts`. Override via `DEFAULT_NETWORK_SCOPE`. New `support_contacts` table.
- Therapist data export — JSON bundle (mood/journal/sleep/assessments). Default `format=json`; FHIR shape gated on `EXPORT_FORMAT=fhir`.
- HIPAA secure messaging — in-app AES-256-GCM encryption. Env `MSG_ENCRYPTION_KEY` (32-byte hex). DEV-ONLY fallback warned at startup.

### MECHANICAL
- Streaming mood anomaly detector — rolling z-score over `moods.mood_score`. Env `ANOMALY_WINDOW=14`, `ANOMALY_Z=2.0`.

### Files
- `server/routes/{integrations,medication,network,exportData,secureMessaging,anomaly}.js`
- `server/index.js` (6 import + 6 mount lines)
- `client/src/pages/IntegrationsAndCarePage.jsx`
- `client/src/App.jsx` (1 import + 1 route line)

### Smoke test
PASS — backend on alt port 3093 (3001 occupied), `/api/health` 200, demo login OK, all new auth-protected routes return correct payloads. Secure-message AES round-trip verified (decrypted body matches input). Anomaly detector returns "insufficient data" when no moods.
