# DEPRECATED — Kubernetes Manifests

These manifests are **deprecated** and preserved for reference only.

## Current Deployment Target

The primary deployment target is **AWS ECS (Fargate)**. All CI/CD pipelines in `.github/workflows/` deploy to ECS, not K8s.

## References

- DR scripts (`ops/recovery/rollback.sh`, `dr-failover.sh`, `dr-failback.sh`) reference `kubectl` commands — these should be updated to use ECS CLI equivalents if K8s is not adopted.
- Documentation references these files for future/alternative deployment.

## Status

- **CI/CD integration**: None — no workflow applies these manifests.
- **Active deployment**: ECS Fargate via `.github/workflows/deploy.yml`, `deploy-production.yml`, `deploy-staging.yml`.
- **Maintenance**: These files are not actively maintained and may be stale.
- **Image tags**: `newTag: latest` — not safe for production rollback. Use explicit SHAs if revived.
- **Secrets template**: `tradingo-secrets-template.yaml` requires manual value replacement before use.

## Future

If K8s becomes the deployment target in a future phase, these manifests should be audited, updated, and wired to a CI/CD workflow before use.
