# TRADINGO SSL/TLS Configuration Guide

## 1. Certificate Management with ACM

### Requesting Certificates

Certificates are provisioned via AWS Certificate Manager (ACM). All certificates must be
requested in **us-east-1** for use with CloudFront, or in the regional endpoint for ALB usage.

```bash
# Request public certificate (us-east-1 for CloudFront)
aws acm request-certificate \
  --domain-name "tradingo.io" \
  --subject-alternative-names "*.tradingo.io" \
  --validation-method DNS \
  --region us-east-1 \
  --tags Key=Service,Value=tradingo Key=Environment,Value=production

# Request public certificate (regional for ALB)
aws acm request-certificate \
  --domain-name "api.tradingo.io" \
  --validation-method DNS \
  --region ap-south-1 \
  --tags Key=Service,Value=tradingo-api Key=Environment,Value=production
```

### DNS Validation

ACM will generate CNAME records for domain validation. Add these to Route53:

```bash
# Get validation records
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/UUID \
  --region us-east-1 \
  --query 'Certificate.DomainValidationOptions'
```

### Imported Certificates

If using externally-procured certificates (e.g., from Sectigo, DigiCert):

```bash
aws acm import-certificate \
  --certificate fileb://certificate.pem \
  --private-key fileb://private-key.pem \
  --certificate-chain fileb://chain.pem \
  --region us-east-1 \
  --tags Key=Service,Value=tradingo
```

## 2. Auto-Renewal Setup

### ACM-Managed Certificates
- ACM automatically renews certificates issued through ACM
- No manual intervention required
- Validation records must remain in DNS for renewal to succeed
- **Automated monitoring**: CloudWatch alarm on certificate expiry date

### External Certificates
- **Renewal frequency**: Every 11 months (30 days before expiry)
- **Automation script**: `scripts/certificate-renew.sh`
- **Process**:
  1. Generate new CSR and obtain certificate from CA
  2. Import into ACM using `aws acm import-certificate`
  3. Verify all ALB/CloudFront listeners use the new certificate
  4. Remove old certificate 7 days after successful rotation

```bash
# Monitor certificate expiry
aws acm list-certificates --region us-east-1 \
  --query 'CertificateSummaryList[?contains(DomainName,`tradingo`)].{Domain:DomainName,ARN:CertificateArn}' \
  --output text | while read domain arn; do
    expiry=$(aws acm describe-certificate --certificate-arn "$arn" \
      --region us-east-1 --query 'Certificate.NotAfter' --output text)
    days_left=$(( ($(date -d "$expiry" +%s) - $(date +%s)) / 86400 ))
    echo "$domain - $days_left days remaining"
    if [ $days_left -lt 30 ]; then
      echo "ALERT: Certificate $domain expires in $days_left days"
    fi
  done
```

## 3. TLS Version and Cipher Suite Configuration

### CloudFront
```
MinimumProtocolVersion: TLSv1.2_2021
SSLSupportMethod: sni-only

Supported Ciphers (CloudFront automatic):
- TLSv1.3: TLS_AES_128_GCM_SHA256, TLS_AES_256_GCM_SHA384, TLS_CHACHA20_POLY1305_SHA256
- TLSv1.2: ECDHE-ECDSA-AES128-GCM-SHA256, ECDHE-ECDSA-AES256-GCM-SHA384,
           ECDHE-RSA-AES128-GCM-SHA256, ECDHE-RSA-AES256-GCM-SHA384,
           ECDHE-ECDSA-CHACHA20-POLY1305, ECDHE-RSA-CHACHA20-POLY1305
```

### Application Load Balancer
```terraform
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.certificate_arn
}
```

### ELB Security Policy
**Policy**: `ELBSecurityPolicy-TLS13-1-2-2021-06`

Provides:
- TLS 1.3 only (no earlier versions)
- TLS 1.2 as fallback (for legacy clients)
- Forward secrecy ciphers (ECDHE) exclusively
- No RC4, 3DES, or export-grade ciphers

### Enabled Ciphers (TLS 1.2)
```
TLS_AES_128_GCM_SHA256          (TLSv1.3)
TLS_AES_256_GCM_SHA384          (TLSv1.3)
TLS_CHACHA20_POLY1305_SHA256    (TLSv1.3)
ECDHE-ECDSA-AES128-GCM-SHA256   (TLSv1.2)
ECDHE-RSA-AES128-GCM-SHA256     (TLSv1.2)
ECDHE-ECDSA-AES128-SHA256       (TLSv1.2)
ECDHE-RSA-AES128-SHA256         (TLSv1.2)
ECDHE-ECDSA-AES256-GCM-SHA384   (TLSv1.2)
ECDHE-RSA-AES256-GCM-SHA384     (TLSv1.2)
ECDHE-ECDSA-AES256-SHA384       (TLSv1.2)
ECDHE-RSA-AES256-SHA384         (TLSv1.2)
```

## 4. HSTS Headers

### Application-Level Configuration
```javascript
// Node.js / Express middleware (web service)
app.use((req, res, next) => {
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader(
      'Strict-Transport-Security',
      `max-age=63072000; includeSubDomains; preload`
    );
  }
  next();
});
```

### ALB Response Headers (via WAF or custom header)
```terraform
resource "aws_lb_listener_rule" "hsts_rule" {
  # Adds HSTS header via ALB rule if not already present
}
```

### HSTS Preload
- Submit to https://hstspreload.org after confirming HSTS is configured
- Subdomains: `tradingo.io`, `*.tradingo.io`
- Minimum `max-age`: 1 year (31536000 seconds)
- Required `includeSubDomains` and `preload` directives

## 5. OCSP Stapling

### CloudFront
CloudFront automatically enables OCSP stapling for all viewer requests.
No additional configuration required.

### ALB
ALB does not natively support OCSP stapling. OCSP stapling is handled at the origin
server level for direct connections. However, since CloudFront sits in front of the ALB,
CloudFront's OCSP stapling provides end-user coverage.

### Nginx (if used as reverse proxy)
```nginx
server {
    listen 443 ssl http2;
    ssl_certificate         /etc/ssl/certs/tradingo.crt;
    ssl_certificate_key     /etc/ssl/private/tradingo.key;
    ssl_trusted_certificate /etc/ssl/certs/ca-chain.crt;
    ssl_stapling            on;
    ssl_stapling_verify     on;
    resolver                8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout        5s;
}
```

## 6. Certificate Monitoring

### CloudWatch Alarms
```bash
# Alarm when certificate expires within 30 days
aws cloudwatch put-metric-alarm \
  --alarm-name "tradingo-certificate-expiry" \
  --alarm-description "Triggers when TLS certificate is within 30 days of expiry" \
  --metric-name "DaysToExpiry" \
  --namespace "Tradingo/Certificates" \
  --statistic Minimum \
  --period 86400 \
  --evaluation-periods 1 \
  --threshold 30 \
  --comparison-operator LessThanThreshold \
  --alarm-actions "arn:aws:sns:us-east-1:ACCOUNT_ID:tradingo-alerts" \
  --treat-missing-data notBreaching
```

### Custom Certificate Expiry Script
```bash
#!/bin/bash
# scripts/check-cert-expiry.sh
# Run daily via cron

DOMAINS=("tradingo.io" "api.tradingo.io" "app.tradingo.io")
SLACK_WEBHOOK="${SLACK_WEBHOOK_URL}"

for domain in "${DOMAINS[@]}"; do
  expiry=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null \
    | openssl x509 -noout -enddate | cut -d= -f2)
  expiry_epoch=$(date -d "$expiry" +%s)
  now_epoch=$(date +%s)
  days_left=$(( (expiry_epoch - now_epoch) / 86400 ))

  echo "$domain: $days_left days until expiry"

  if [ "$days_left" -lt 30 ]; then
    message="⚠️ Certificate for $domain expires in $days_left days"
    curl -s -X POST -H "Content-Type: application/json" \
      -d "{\"text\":\"$message\"}" "$SLACK_WEBHOOK"
  fi
done
```

## 7. Summary of SSL/TLS Configuration

| Component | Protocol | Certificate Source | Auto-Renewal |
|-----------|----------|--------------------|--------------|
| CloudFront | TLS 1.2/1.3 | ACM (us-east-1) | Yes (ACM-managed) |
| ALB | TLS 1.2/1.3 | ACM (ap-south-1) | Yes (ACM-managed) |
| RDS | TLS 1.2 | RDS CA bundle | Manual rotation |
| Redis (ElastiCache) | Encryption in-transit | AWS managed | Automatic |
| OpenSearch | TLS 1.2 | ACM / Custom CA | Via ACM |

### Security Headers Checklist
- [x] HSTS: `max-age=63072000; includeSubDomains; preload`
- [x] X-Content-Type-Options: `nosniff`
- [x] X-Frame-Options: `DENY`
- [x] X-XSS-Protection: `1; mode=block`
- [x] Referrer-Policy: `strict-origin-when-cross-origin`
- [x] Content-Security-Policy: configured per service
- [x] Permissions-Policy: restricted APIs
- [x] Cache-Control: appropriate for resource type
