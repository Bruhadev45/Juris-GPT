# JurisGPT Deployment Guide for DigitalOcean

## Prerequisites
- DigitalOcean account
- Domain: jurisgpt.me (configured in DigitalOcean)
- GitHub repository: https://github.com/Bruhadev45/Juris-GPT

## Option 1: DigitalOcean App Platform (Recommended)

### Step 1: Deploy via App Platform
```bash
# Install doctl CLI
brew install doctl  # macOS
# or
wget https://github.com/digitalocean/doctl/releases/download/v1.94.0/doctl-1.94.0-linux-amd64.tar.gz
tar xf doctl-1.94.0-linux-amd64.tar.gz
sudo mv doctl /usr/local/bin

# Authenticate
doctl auth init

# Create app from spec
doctl apps create --spec .do/app.yaml

# Or use the web interface:
# 1. Go to: https://cloud.digitalocean.com/apps
# 2. Click "Create App"
# 3. Connect GitHub repository: Bruhadev45/Juris-GPT
# 4. Select branch: main
# 5. Upload the .do/app.yaml file
```

### Step 2: Configure Environment Variables
In DigitalOcean App Platform:
1. Go to your app → Settings → Environment Variables
2. Add the following secrets:
   - `OPENAI_API_KEY`
   - `JWT_SECRET`
   - `RESEND_API_KEY`
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `DO_SPACES_KEY`
   - `DO_SPACES_SECRET`
   - `SUPABASE_URL`
   - `SUPABASE_KEY`

### Step 3: Configure Domain
1. Go to Settings → Domains
2. Add custom domain: `jurisgpt.me`
3. Add www alias: `www.jurisgpt.me`
4. DigitalOcean will provide DNS records

### Step 4: Update DNS at Domain Registrar
Add these DNS records at your domain registrar:
```
Type    Name    Value
A       @       <App Platform IP>
CNAME   www     <App Platform domain>
```

## Option 2: Docker on Droplet (More Control)

### Step 1: Create a Droplet
```bash
# Create a droplet (via web UI or doctl)
doctl compute droplet create jurisgpt \
  --image ubuntu-22-04-x64 \
  --size s-2vcpu-4gb \
  --region blr1 \
  --ssh-keys <your-ssh-key-id>

# Get droplet IP
doctl compute droplet list
```

### Step 2: SSH into Droplet
```bash
ssh root@<droplet-ip>
```

### Step 3: Install Docker & Docker Compose
```bash
# Update packages
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Start Docker
systemctl start docker
systemctl enable docker
```

### Step 4: Clone Repository
```bash
git clone https://github.com/Bruhadev45/Juris-GPT.git
cd Juris-GPT

# Create .env file
nano .env
# Add all environment variables
```

### Step 5: Get SSL Certificate
```bash
# Install certbot
apt install certbot python3-certbot-nginx -y

# Get certificate
certbot certonly --standalone -d jurisgpt.me -d www.jurisgpt.me -d api.jurisgpt.me

# Copy certificates to project
mkdir -p ssl
cp /etc/letsencrypt/live/jurisgpt.me/fullchain.pem ssl/
cp /etc/letsencrypt/live/jurisgpt.me/privkey.pem ssl/
```

### Step 6: Deploy with Docker Compose
```bash
# Build and start containers
docker-compose up -d --build

# Check logs
docker-compose logs -f

# Check status
docker-compose ps
```

### Step 7: Configure DNS
At your domain registrar, add:
```
Type    Name    Value
A       @       <droplet-ip>
A       api     <droplet-ip>
CNAME   www     jurisgpt.me
```

### Step 8: Setup Auto-renewal for SSL
```bash
# Add cron job for certificate renewal
crontab -e

# Add this line:
0 0 1 * * certbot renew --quiet && cp /etc/letsencrypt/live/jurisgpt.me/*.pem /root/Juris-GPT/ssl/ && docker-compose restart nginx
```

## Option 3: Managed Database (Optional)

If you want to replace the in-memory user store with a real database:

### Using DigitalOcean Managed PostgreSQL
```bash
# Create database cluster
doctl databases create jurisgpt-db \
  --engine pg \
  --region blr1 \
  --size db-s-1vcpu-1gb \
  --version 14

# Get connection details
doctl databases connection jurisgpt-db

# Update backend/.env with database URL
DATABASE_URL=postgresql://user:password@host:port/database
```

## Post-Deployment Checklist

- [ ] Backend health check: https://api.jurisgpt.me/health
- [ ] Frontend loads: https://jurisgpt.me
- [ ] SSL certificate valid (check padlock icon)
- [ ] Chat streaming works
- [ ] File uploads work
- [ ] Authentication works
- [ ] Check logs for errors
- [ ] Monitor resource usage
- [ ] Setup backups for data volumes

## Cost Estimation

### App Platform (Option 1)
- Backend (Professional XS): $12/month
- Frontend (Basic XS): $5/month
- **Total: ~$17/month**

### Droplet (Option 2)
- Droplet (2 vCPU, 4GB RAM): $24/month
- Managed PostgreSQL (optional): $15/month
- **Total: ~$24-39/month**

### Shared Resources
- DigitalOcean Spaces: $5/month (already using)
- Domain: varies by registrar

## Monitoring

### View Logs
```bash
# App Platform
doctl apps logs <app-id> --type run

# Docker
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Monitor Resources
```bash
# App Platform
doctl apps list-deployments <app-id>

# Droplet
docker stats
htop
```

## Troubleshooting

### Backend not starting
```bash
# Check logs
docker-compose logs backend

# Common issues:
# - Missing environment variables
# - Port conflicts
# - Out of memory (upgrade droplet)
```

### Frontend build fails
```bash
# Check Node.js version
node --version  # Should be 20+

# Clear cache and rebuild
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
```

### SSL certificate issues
```bash
# Test certificate
openssl s_client -connect jurisgpt.me:443

# Renew manually
certbot renew
```

## Next Steps
1. Setup monitoring (DigitalOcean Monitoring or external service)
2. Configure automated backups
3. Setup CI/CD pipeline
4. Configure rate limiting and DDoS protection
5. Setup error tracking (Sentry)
