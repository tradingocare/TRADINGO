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

## 7. Approval status

Implemented on dedicated branch `fix/deploy-backup-ssh-bootstrap` off `main`
(`5bcccebd2`). Not merged, not pushed to `main`, no PR opened, no workflow dispatched,
no VPS connection. Awaiting founder review.
