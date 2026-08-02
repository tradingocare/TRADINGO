# SSL Certificates

For development, generate a self-signed certificate:

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout infrastructure/nginx/ssl/privkey.pem \
  -out infrastructure/nginx/ssl/fullchain.pem \
  -subj "/C=IN/ST=State/L=City/O=TRADINGO/CN=tradingo.local"
```

For production, use Let's Encrypt cert-manager (K8s) or obtain certificates and place them here.
