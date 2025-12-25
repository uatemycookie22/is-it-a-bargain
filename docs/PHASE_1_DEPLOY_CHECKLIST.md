# Phase 1 Deployment Checklist

## Pre-deployment (One-time setup on Lightsail)

SSH into the Lightsail instance and create the data directory:

```bash
ssh ubuntu@18.215.116.116
sudo mkdir -p /data/bargain
sudo chown ubuntu:ubuntu /data/bargain
exit
```

## Deploy

```bash
git add .
git commit -m "Phase 1: Database setup with Drizzle + SQLite"
git push origin main
```

## Post-deployment Verification

1. Check GitHub Actions workflow completes successfully
2. Verify database file exists on instance:
   ```bash
   ssh ubuntu@18.215.116.116 "ls -lh /data/bargain/"
   ```
3. Check container logs:
   ```bash
   ssh ubuntu@18.215.116.116 "podman logs bargain-api | grep -i migration"
   ```
   Should see "Running migrations..." and "Migrations complete."

4. Test API health:
   ```bash
   curl https://bargain-api.callingallheroes.net/api/user
   ```
   (Will return error for now since auth not implemented, but should not be 500)
