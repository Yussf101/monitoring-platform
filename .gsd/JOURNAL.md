# JOURNAL.md — Project Journal

> Chronological log of significant events, insights, and progress.

---

## 2026-09-15 — Project Initialized

- GSD installed and configured
- SPEC.md finalized from existing implementation_plan.md
- ROADMAP.md created with 8 phases (optimized order: Ansible moved to Phase 2)
- Key decisions recorded in DECISIONS.md
- Ready for `/plan 1`

## 2026-09-18 — Phase 1 Completed

### Objective
Build the Phase 1 Foundation: FastAPI Backend, PostgreSQL, and Docker Compose orchestration.

### Accomplished
- Setup `docker-compose.yml` for DB and backend.
- Setup FastAPI with `asyncpg` and SQLAlchemy Layered Architecture.
- Created `Target` and `Alert` models and CRUD endpoints.
- Built `/api/discovery` endpoint for Prometheus.
- Ran Alembic migrations successfully.
- Verified all endpoints via Swagger UI.

### Verification
- [x] Docker containers start successfully
- [x] Migrations apply cleanly
- [x] API handles requests correctly (tested via curl and Swagger)
- [ ] Front-end integration (Future phase)

### Paused Because
Context hygiene: Handoff to a new chat window to start Phase 2 with a clean context and zero token bloat.

### Handoff Notes
Start the next session by running `/discuss-phase 2`.

---

## Session: 2026-09-19 19:00–21:07

### Objective
Complete Phase 2: Infrastructure Automation — Ansible + Node Exporter provisioning on real VMs.

### Accomplished
- Built full Ansible project structure (site.yml, node_exporter role, handlers, templates, ansible.cfg)
- Extended Target model and DB schema with `ssh_user` field via Alembic migration
- Built `dynamic_inventory.py` — queries FastAPI at runtime to build the Ansible host list dynamically
- Built `ansible/Dockerfile` + `entrypoint.sh` to run Ansible inside Docker (fixes Windows SSH 0777 permission issue)
- Integrated `ansible` service in `docker-compose.yml` under `profiles: ["provision"]`
- Set up SSH key auth from Windows host to both VMs
- Successfully ran Ansible against both Ubuntu (192.168.28.133) and Fedora (192.168.28.132) VMs — `failed=0` on both
- Cleaned up AI-sounding docstrings on all backend Python files
- Committed and pushed all changes to GitHub

### Verification
- [x] `docker compose --profile provision run --rm ansible` exits with `failed=0, unreachable=0`
- [x] Node Exporter running on both VMs (confirmed via Ansible `Verify` task)
- [x] Dynamic inventory correctly pulls from FastAPI API
- [ ] Browser validation of `http://<vm-ip>:9100/metrics` (user to confirm)

### Paused Because
Session complete — Phase 2 is fully done and pushed.

### Handoff Notes
Next phase is **Phase 3: Prometheus Integration — Dynamic Service Discovery**.
The `/api/discovery` endpoint skeleton already exists from Phase 1. Start with `/plan 3`.


---

## Session: 2026-09-19 21:16–23:51

### Objective
Complete Phase 3: Prometheus Integration — Dynamic Service Discovery.

### Accomplished
- Planned Phase 3 with two execution plans.
- Modified `/api/discovery` labels to use `monitoring_*` prefix instead of `__meta_*` to simplify Prometheus label handling.
- Implemented and passed 4 integration tests for the discovery endpoint using `pytest`, `httpx`, and `aiosqlite`.
- Added `prometheus/prometheus.yml` configured to use `http_sd_configs` pulling from the backend every 30s.
- Added the `prometheus` service to `docker-compose.yml` with lifecycle API enabled.
- Addressed testing queries and explained the why and how of the integration.

### Verification
- [x] Integration tests pass in backend container (`pytest tests/ -v`).
- [ ] End-to-end verification (adding a target via API and checking Prometheus UI).

### Paused Because
Session limit reached / user requested a pause for context hygiene before starting Phase 4.

### Handoff Notes
Next up is **Phase 4: Alerting Pipeline — Alertmanager + Webhook + Telegram**.
Start the next session by running `/plan 4`.

---

## Session: 2026-09-21 16:00–18:42

### Objective
Complete Phase 4: Alerting Pipeline (Prometheus rules -> Alertmanager -> FastAPI -> PostgreSQL -> Telegram).

### Accomplished
- Created 4 base Prometheus alert rules + 4 enterprise rules (Disk predict, Network, Load, Inodes).
- Configured Alertmanager to route to `POST /api/alerts/webhook`.
- Built the `alert_service.py` to persist alerts to PostgreSQL and handle deduplication.
- Built `telegram_service.py` to dispatch HTML-formatted messages.
- Fixed 3 edge-case bugs: batch IP mismatch, missing deduplication, confusing resolved messaging.
- Passed all 6 new integration tests.
- Successfully verified the pipeline end-to-end via `/verify`, running real tests against the DB.

### Verification
- [x] Webhook accepts payloads and persists to DB.
- [x] Deduplication successfully prevents spam.
- [x] Telegram bot successfully sends formatted 🔴 FIRING and 🟢 RESOLVED messages.
- [x] VERIFICATION.md report generated with full empirical evidence.

### Paused Because
Phase 4 is complete and verified. Saving state before moving to Phase 5.

### Handoff Notes
Next up is **Phase 5: Admin Dashboard (Next.js Frontend)**.
Start the next session by running `/execute 5` (if a plan exists) or `/plan 5`.

---

## Session: 2026-09-21 18:46–20:06

### Objective
Re-plan and begin executing Phase 5: Admin Dashboard.

### Accomplished
- User rejected the Next.js specification in favor of a lighter SPA architecture.
- Re-planned Phase 5 into 4 new plans using **React + Vite**.
- Discussed UI aesthetics. User explicitly authorized **Tailwind CSS v3** and **shadcn/ui** to guarantee a premium, professional control plane design without the generic "AI generated" look.
- Executed Wave 1 (Plan 5.1) inline: Scaffolded Vite, initialized Tailwind v3 and shadcn/ui, created typed API client, and wired Nginx Dockerfile into `docker-compose.yml`.

### Verification
- [x] Vite React app builds successfully.
- [x] API client type-checks against backend Pydantic schemas perfectly.
- [x] `docker compose config` is valid.

### Paused Because
Wave 1 complete. Pausing for context hygiene before diving into the UI component building of Wave 2.

### Handoff Notes
Next up is Wave 2 (Plans 5.2 and 5.3) for the Target Management and Alert History pages.
Start the next session by running `/execute 5`.

---

## Session: 2026-09-21 20:10–20:17

### Objective
Execute Phase 5 Wave 2 (Plan 5.2) to build the Target Management Page.

### Accomplished
- Installed shadcn UI components (`button`, `badge`, `dialog`, `input`, `label`, `table`), React Router, and Lucide Icons.
- Fixed `components.json` directory output that created an `@` folder instead of pointing to `src`.
- Built the `Navbar` component with routing.
- Built `TargetsPage`, `TargetTable`, and `AddTargetModal`.
- Fixed type errors by matching frontend types to the backend Pydantic schemas (using `ip_address` instead of `url`).
- Successfully verified the build with `npm run build`.

### Verification
- [x] Vite React app builds successfully without TS errors.
- [x] Target table and modal correctly implemented with shadcn components.

### Paused Because
Context hygiene: Handoff to a new chat window to start Plan 5.3 with a clean context and zero token bloat.

### Handoff Notes
Next up is Plan 5.3 for the Alert History page. Start the next session by running `/execute 5` (which will pick up 5.3 automatically).

---

## Session: 2026-09-21 20:19–20:26

### Objective
Execute Phase 5 Wave 2 (Plan 5.3) to build the Alert History Page.

### Accomplished
- Installed shadcn `Select` component and moved it to the correct `src/` directory.
- Built `AlertTable.tsx` with a shadcn Table, status badges (destructive with pulsing red dot for firing, outline green for resolved), and severity badges.
- Built `AlertsPage.tsx` with Select dropdown filters for Status and Severity, and a Load More pagination button.
- Updated `App.tsx` to use the real `<AlertsPage />` component instead of the placeholder.
- Verified build succeeds (`npm run build`).

### Verification
- [x] Vite React app builds successfully.
- [x] Alert table and page correctly implemented with shadcn components.
- [ ] Verify functionality against live backend data (requires frontend to be running). Note: The user tried `rpm run dev` (typo for `npm run dev`) and it failed.

### Paused Because
Session limit reached / Context hygiene: Handoff to a new chat window to start Plan 5.4 with a clean context.

### Handoff Notes
Next up is Plan 5.4, the final plan for Phase 5 (System Overview / Dashboard page).
Start the next session by running `/execute 5`.
