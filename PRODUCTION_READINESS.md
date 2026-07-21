# Governed clinician-visible care support

The durable path is `/api/governed-care-support`. Clinic tenant membership, Bearer auth, tenant/idempotency headers, consent evidence, and scoped roles are mandatory. Cases move through validated observations, uncertainty review, independent clinician review, owned follow-up, support activation, human escalation, resolution, and closure. Evidence is opaque/digested, history is append-only, versions are optimistic, and retention/consent provenance are explicit.

Apply `server/migrations/001_governed_care_support.sql` only through a reviewed clinical deployment migrator. EHR/FHIR, pharmacy, scheduling, device, clinician messaging, and payer connectors remain unconfigured until consent, credentials, data contracts, acknowledgements, and failure tests are approved. Chat, AI, coaching, voice, anomaly, and generated provider routes are quarantined in production.

The deterministic layer does not diagnose, prescribe, change medication, or provide emergency care. Urgent signals require immediate human escalation; missing consent/data, contraindication uncertainty, or clinician unavailability produce a hold. Clinical accuracy, calibration, bias, contraindications, representative datasets, privacy review, and licensed clinician ownership are external gates and fail closed.

Use secret management with `.env.example`, keeping demo/bootstrap/provider switches false. Run `node --test server/governance/workflow.test.cjs` and `bash -n start.sh`. Startup does not install, migrate, seed, recreate databases, or terminate unrelated processes.
