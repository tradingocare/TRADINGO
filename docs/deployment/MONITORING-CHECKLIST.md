# TRADINGO Monitoring Checklist

## Prometheus

- [ ] All scrape targets are UP
  - [ ] tradingo-api (`api:3001/api/v1/metrics`)
  - [ ] tradingo-api-internal (`api:9100/metrics`)
  - [ ] postgres-exporter
  - [ ] redis-exporter
  - [ ] opensearch-exporter
  - [ ] node-exporter
  - [ ] cadvisor
  - [ ] alertmanager
  - [ ] aws-ecs-exporter
- [ ] Recording rules compiled and running
- [ ] Alert rules firing correctly

## Grafana

- [ ] Data source configured (Prometheus)
- [ ] API dashboard panels rendering data
- [ ] Latency (p50/p95/p99) visible
- [ ] Error rate visible
- [ ] Request rate visible
- [ ] Alertmanager configured as notification channel

## Alerting (Alertmanager)

- [ ] Slack webhook configured
- [ ] PagerDuty integration configured (critical)
- [ ] Email notification configured (info)
- [ ] Inhibition rules active
- [ ] Test alert fired and received

## Sentry

- [ ] DSN configured for API
- [ ] DSN configured for Web
- [ ] Source maps uploaded on deploy
- [ ] Error rate alert configured
- [ ] Performance tracing active (sample rate 0.2)

## Logging

- [ ] CloudWatch log groups exist for all services
- [ ] Log retention policy set (30 days for staging, 90 days for prod)
- [ ] Structured JSON logging enabled
- [ ] Error logs alerting configured

## Uptime & Synthetic Monitoring

- [ ] External uptime check configured (e.g., Pingdom, Checkly)
- [ ] Synthetic transaction monitoring active
- [ ] SSL certificate expiry alert active
- [ ] Domain expiry monitoring active
