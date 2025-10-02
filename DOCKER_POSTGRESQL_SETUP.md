# PostgreSQL with Docker - Setup Guide

## Prerequisites

### Install Docker Desktop for Windows

If you don't have Docker installed:

1. **Download Docker Desktop:**
   - Go to: https://www.docker.com/products/docker-desktop
   - Download Docker Desktop for Windows

2. **Install Docker Desktop:**
   - Run the installer
   - Follow the installation wizard
   - Restart your computer if prompted

3. **Start Docker Desktop:**
   - Launch Docker Desktop from Start menu
   - Wait for Docker to start (icon in system tray will stop animating)

4. **Verify Docker is running:**
   ```powershell
   docker --version
   docker-compose --version
   ```

---

## Quick Start (3 Commands)

```powershell
# 1. Start PostgreSQL container
docker-compose up -d

# 2. Run Prisma migration
npx prisma migrate dev --name remove_fields_update_schema

# 3. Start your backend
npm start
```

---

## Detailed Steps

### Step 1: Start PostgreSQL Container

```powershell
# From your project directory
cd C:\Users\acer\Desktop\testSTC

# Start PostgreSQL in background (-d = detached mode)
docker-compose up -d
```

**Expected Output:**
```
Creating network "teststc_default" with the default driver
Creating volume "teststc_postgres_data" with local driver
Creating triage_db_postgres ... done
```

### Step 2: Verify Container is Running

```powershell
# Check container status
docker ps

# Should show:
# CONTAINER ID   IMAGE                PORTS                    NAMES
# xxxxxxxxxxxx   postgres:14-alpine   0.0.0.0:5432->5432/tcp   triage_db_postgres
```

### Step 3: Check Database Health

```powershell
# View container logs
docker logs triage_db_postgres

# Should show:
# database system is ready to accept connections
```

### Step 4: Run Prisma Migration

```powershell
# Run the migration
npx prisma migrate dev --name remove_fields_update_schema

# Expected output:
# Applying migration `20241002_remove_fields_update_schema`
# ✔ Generated Prisma Client
```

### Step 5: Start Your Application

```powershell
# Start backend
npm start

# In another terminal, start frontend
cd Frontend
npm run dev
```

---

## Docker Compose Configuration

Your `docker-compose.yml` configures:

```yaml
Database: triage_db
Username: postgres
Password: postgres123
Port: 5432 (mapped to localhost:5432)
Volume: postgres_data (persists data between restarts)
```

**DATABASE_URL in `.env`:**
```
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/triage_db"
```

---

## Useful Docker Commands

### Container Management

```powershell
# Start container (if stopped)
docker-compose up -d

# Stop container
docker-compose down

# Stop and remove volumes (⚠️ deletes all data)
docker-compose down -v

# Restart container
docker-compose restart

# View container logs
docker logs triage_db_postgres

# Follow logs in real-time
docker logs -f triage_db_postgres
```

### Database Access

```powershell
# Connect to PostgreSQL via psql
docker exec -it triage_db_postgres psql -U postgres -d triage_db

# Once inside psql:
\dt               # List all tables
\d patients       # Describe patients table
\d cases          # Describe cases table
SELECT * FROM patients;  # Query patients
\q                # Exit psql
```

### Container Status

```powershell
# List all containers (running and stopped)
docker ps -a

# Check container resource usage
docker stats triage_db_postgres

# Inspect container configuration
docker inspect triage_db_postgres
```

---

## Troubleshooting

### Issue: Port 5432 already in use

**Error:**
```
Bind for 0.0.0.0:5432 failed: port is already allocated
```

**Solutions:**

1. **Find what's using port 5432:**
   ```powershell
   netstat -ano | findstr "5432"
   ```

2. **Stop conflicting service:**
   ```powershell
   # If it's another PostgreSQL instance
   Stop-Service postgresql-x64-14
   
   # Or kill the process (replace PID with actual process ID)
   taskkill /PID <PID> /F
   ```

3. **Or change the port in docker-compose.yml:**
   ```yaml
   ports:
     - "5433:5432"  # Use port 5433 on host
   ```
   
   Then update `.env`:
   ```
   DATABASE_URL="postgresql://postgres:postgres123@localhost:5433/triage_db"
   ```

---

### Issue: Docker daemon not running

**Error:**
```
error during connect: This error may indicate that the docker daemon is not running
```

**Solution:**
1. Open Docker Desktop
2. Wait for it to start (icon in system tray)
3. Try command again

---

### Issue: Container keeps restarting

**Check logs:**
```powershell
docker logs triage_db_postgres
```

**Common causes:**
- Insufficient memory
- Corrupted data volume
- Port conflict

**Solution:**
```powershell
# Remove and recreate container
docker-compose down -v
docker-compose up -d
```

---

### Issue: Can't connect to database

**Verify container is healthy:**
```powershell
docker exec triage_db_postgres pg_isready -U postgres
```

**Test connection:**
```powershell
docker exec -it triage_db_postgres psql -U postgres -c "SELECT version();"
```

**Check if database exists:**
```powershell
docker exec -it triage_db_postgres psql -U postgres -c "\l"
```

---

### Issue: Permission denied errors

**Run PowerShell as Administrator:**
1. Right-click PowerShell
2. Select "Run as Administrator"
3. Try commands again

---

## Data Persistence

Your database data is stored in a Docker volume named `teststc_postgres_data`.

### Backup Database

```powershell
# Create backup
docker exec triage_db_postgres pg_dump -U postgres triage_db > backup.sql

# With timestamp
docker exec triage_db_postgres pg_dump -U postgres triage_db > backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql
```

### Restore Database

```powershell
# Restore from backup
Get-Content backup.sql | docker exec -i triage_db_postgres psql -U postgres -d triage_db
```

### Reset Database

```powershell
# Stop and remove everything (⚠️ deletes all data)
docker-compose down -v

# Start fresh
docker-compose up -d

# Run migration
npx prisma migrate dev --name remove_fields_update_schema
```

---

## Advanced Configuration

### Change PostgreSQL Version

Edit `docker-compose.yml`:
```yaml
services:
  postgres:
    image: postgres:15-alpine  # Change to version 15
    # or
    image: postgres:16-alpine  # Change to version 16
```

### Change Credentials

Edit `docker-compose.yml`:
```yaml
environment:
  POSTGRES_USER: myuser
  POSTGRES_PASSWORD: mypassword
  POSTGRES_DB: mydb
```

Update `.env`:
```
DATABASE_URL="postgresql://myuser:mypassword@localhost:5432/mydb"
```

### Add pgAdmin (Web UI)

Add to `docker-compose.yml`:
```yaml
services:
  postgres:
    # ... existing config ...

  pgadmin:
    image: dpage/pgadmin4
    container_name: triage_pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@admin.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    depends_on:
      - postgres
```

Access pgAdmin at: http://localhost:5050

---

## Docker Desktop Alternative (Optional)

If you prefer command-line only without Docker Desktop:

### Using Docker Engine (WSL2)

1. Enable WSL2:
   ```powershell
   wsl --install
   ```

2. Install Docker in WSL:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   ```

---

## Complete Setup Checklist

- [ ] Docker Desktop installed and running
- [ ] `docker --version` works
- [ ] `docker-compose.yml` file created
- [ ] `.env` file updated with correct DATABASE_URL
- [ ] Run: `docker-compose up -d`
- [ ] Verify: `docker ps` shows running container
- [ ] Run: `npx prisma migrate dev --name remove_fields_update_schema`
- [ ] Run: `npm start` (backend)
- [ ] Run: `cd Frontend && npm run dev` (frontend)
- [ ] Test: Add a patient in the UI

---

## Quick Reference

```powershell
# Start everything
docker-compose up -d && npx prisma migrate dev && npm start

# Stop everything
docker-compose down

# View logs
docker logs -f triage_db_postgres

# Access database
docker exec -it triage_db_postgres psql -U postgres -d triage_db

# Restart database
docker-compose restart

# Clean restart (⚠️ deletes data)
docker-compose down -v && docker-compose up -d
```

---

## After Setup is Complete

Once PostgreSQL is running in Docker:

1. ✅ Database is running at `localhost:5432`
2. ✅ Credentials: `postgres` / `postgres123`
3. ✅ Database: `triage_db`
4. ✅ Data persists between restarts
5. ✅ Ready for Prisma migration

**Next steps:**
```powershell
npx prisma migrate dev --name remove_fields_update_schema
npm start
cd Frontend && npm run dev
```

---

## Resources

- Docker Desktop: https://www.docker.com/products/docker-desktop
- Docker Compose Docs: https://docs.docker.com/compose/
- PostgreSQL Docker Image: https://hub.docker.com/_/postgres
- Prisma with Docker: https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel

---

**Need Help?**
- Docker Desktop not starting: Check Windows version (needs Windows 10/11 Pro or Home with WSL2)
- Port conflicts: Change port to 5433 in docker-compose.yml
- Can't find Docker: Make sure Docker Desktop is running (check system tray)
