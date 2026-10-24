# BACKUP-WORKFLOW-HOSTKEY-REMEDIATION

Remediation record for the SSH bootstrap defect in `.github/workflows/deploy-backup.yml`.

## 1. Objective

Restore the backup-only workflow's ability to establish a verified SSH session to the
production VPS, without weakening host-key verification and without touching any other
workflow or production system.

## 2. Root cause (audit — read-only)

Two defects were present in `.github/workflows/deploy-backup.yml`:

1. **`VPS_KNOWN_HOSTS` never installed.** The secret was only checked for presence; no
   step ever wrote it to a `known_hosts` file. The deploy step runs
   `StrictHostKeyChecking=yes`, so with an empty/absent known-hosts file every SSH
   connection failed closed (host key verification failure).
2. **`VPS_SSH_KEY` never loaded.** No `webfactory/ssh-agent` (or equivalent) step
   existed, so no private key was available to the agent — a latent
   `Permission denied (publickey)` once the host-key problem was fixed.

Both were confirmed original to the file (not a regression introduced by recent changes).
`.github/workflows/deploy-production.yml` already contains the correct pattern; the fix
mirrors it.

## 3. Change applied

Single workflow file, two additions (32 added lines, 0 deletions):

- **`Setup SSH Key`** — `webfactory/ssh-agent@v0.10.0` loading `secrets.VPS_SSH_KEY`
  (same pinned action/version as `deploy-production.yml`).
- **`Install pinned VPS host keys`** — writes `secrets.VPS_KNOWN_HOSTS` to
  `~/.ssh/known_hosts` (mode 600), fail-closed on an unrecognised key type.
- **Non-revealing `ssh-keygen -F` pre-flight** inside the deploy step: confirms the
  pinned known-hosts file contains an entry for the exact configured target
  (`VPS_HOST`, or `[VPS_HOST]:VPS_PORT` when the port is non-default) before connecting.
  Output is discarded (`>/dev/null`); only match/no-match is logged, so no key material
  or secret value can reach the logs.

`StrictHostKeyChecking=yes` is retained. No bypass mechanism
(`StrictHostKeyChecking=no`, `UserKnownHostsFile=/dev/null`, runtime `ssh-keyscan`) was
introduced.

## 4. Files changed

- `.github/workflows/deploy-backup.yml` (workflow fix)
- `scripts/deploy/tests/test-backup-workflow.sh` (regression coverage: B13–B18)

## 5. Verification

- `scripts/deploy/tests/test-backup-workflow.sh` → **18/18 PASS** (B13 ssh-agent,
  B14 known_hosts install, B15 `StrictHostKeyChecking=yes` retained, B16 no bypass,
  B17 `ssh-keygen -F` pre-flight, B18 existing gates intact).
- `scripts/deploy/tests/test-deploy-backup-context.sh` → 3/3 PASS.
- `scripts/deploy/tests/test-backup-timeout-gates.sh` failures (B7–B15) are
  **pre-existing** and target `deploy-production.yml` / `verify-backup.sh`, neither of
  which this change touches.
- YAML parse of `deploy-backup.yml` → valid.
- Diff contains no unrelated edits and no secret values.

Note: workflow checks are static/mocked; no live VPS connection was made (prohibited).

## 6. Outstanding trust gate (MUST complete before first production use)

Per founder direction, **independent authentication of the host key is required before
the workflow is trusted for production**. The pinned key currently rests on an
internally-consistent Hostinger record only; it has **not** been independently
authenticated, and this change does not authenticate it. Do not dispatch
`deploy-backup.yml` until the founder has independently authenticated the host key
fingerprint.

**Status update (2026-10-18): SATISFIED.** The founder authenticated the server's
ED25519 host-key fingerprint out-of-band via the Hostinger browser console; it matches
the previously recorded fingerprint exactly. See §8 for the evidence record. The
workflow has still **not** been dispatched.

## 7. Approval status

Implemented on dedicated branch `fix/deploy-backup-ssh-bootstrap` off `main`
(`5bcccebd2`). Not merged, not pushed to `main`, no PR opened, no workflow dispatched,
no VPS connection. Awaiting founder review.

**Update (2026-10-18):** this section is a pre-merge snapshot. PR #58 was merged to
`main` as `48af7a4708e60e1e1c578f68fa5ef0c82ad26c9c` (2026-10-18T05:32:59Z).

## 8. Host-key verification evidence (out-of-band) — 2026-10-18

Recorded 2026-10-18T06:08Z (UTC) on founder instruction, from evidence reported by
the founder in the same working session.

- **Verification channel:** Hostinger VPS browser console (server-side console,
  accessed through the founder's authenticated Hostinger account session). This
  channel is independent of the SSH/DNS trust path and is one of the out-of-band
  verification sources required by §6 and `docs/deployment/VPS-DEPLOYMENT-GUIDE.md`
  §12.3.
- **Command run on the server (via the console):**
  `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub`
- **Console output:**
  `256 SHA256:9v4/6X4YuDjLU5aCiWts08c4B7a8/13zem/LcDHHZd0 root@srv1889262 (ED25519)`
  (the `root@srv1889262` suffix is the key comment field, not the SSH login user).
- **Match:** the founder reports this output matches the previously recorded
  fingerprint exactly. The earlier record is founder-held and not committed to this
  repository.
- **Conclusion:** the independent-authentication requirement in §6 is **satisfied**
  as of 2026-10-18. Pinned trust and `StrictHostKeyChecking=yes` are unchanged; no
  bypass was introduced. The workflow was **not** dispatched.

**Audit caveat:** GitHub secret values are write-only and cannot be re-read via API,
so the equivalence between the console fingerprint and the key material stored in
`VPS_KNOWN_HOSTS` cannot be mechanically re-derived by this audit; it rests on the
founder's comparison against the previously recorded value.
