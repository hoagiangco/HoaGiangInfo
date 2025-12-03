# Deployment Guide

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Domain name (optional)
- SSL certificate (for production)

## Environment Variables

Create `.env` file with:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/resort_info?schema=public"

# Admin
ADMIN_PASSWORD="strong-password-here"
ADMIN_PASSWORD_HASH="" # Optional: pre-hashed password

# Application
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NODE_ENV="production"
```

## Build Steps

### 1. Install Dependencies

```bash
cd Frontend
npm install
```

### 2. Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed initial data (optional)
npm run db:seed
```

### 3. Build Application

```bash
npm run build
```

### 4. Start Production Server

```bash
npm start
```

## Deployment Options

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

Vercel will automatically:
- Build the application
- Run database migrations
- Deploy to CDN

### Docker

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t resort-info .
docker run -p 3000:3000 --env-file .env resort-info
```

### Traditional Server

1. Setup Node.js on server
2. Clone repository
3. Install dependencies
4. Build application
5. Use PM2 or systemd to run:
```bash
pm2 start npm --name "resort-info" -- start
```

## Database Setup

### Production Database

1. Create PostgreSQL database
2. Update `DATABASE_URL` in `.env`
3. Run migrations:
```bash
npm run db:migrate
```

### Backup

Regular backups recommended:
```bash
pg_dump -U user -d resort_info > backup.sql
```

## Security Checklist

- [ ] Change default admin password
- [ ] Use strong database password
- [ ] Enable HTTPS/SSL
- [ ] Set secure cookie flags
- [ ] Limit file upload size
- [ ] Validate all inputs
- [ ] Enable rate limiting
- [ ] Setup firewall rules
- [ ] Regular security updates

## Performance Optimization

1. **Database Indexing**: Add indexes for frequently queried fields
2. **CDN**: Use CDN for static assets
3. **Caching**: Implement Redis for session/data caching
4. **Image Optimization**: Use Next.js Image component
5. **Database Connection Pooling**: Configure Prisma connection pool

## Monitoring

### Recommended Tools

- **Uptime**: UptimeRobot, Pingdom
- **Logs**: LogRocket, Sentry
- **Analytics**: Google Analytics, Plausible
- **Performance**: Vercel Analytics, New Relic

## Troubleshooting

### Database Connection Issues

- Check `DATABASE_URL` format
- Verify database is accessible
- Check firewall rules
- Test connection: `psql $DATABASE_URL`

### Build Errors

- Clear `.next` folder
- Delete `node_modules` and reinstall
- Check Node.js version (18+)

### Runtime Errors

- Check environment variables
- Review application logs
- Verify database migrations ran
- Check file permissions

## Maintenance

### Regular Tasks

1. **Database Backups**: Daily
2. **Security Updates**: Weekly
3. **Dependency Updates**: Monthly
4. **Performance Review**: Quarterly

### Updates

```bash
# Update dependencies
npm update

# Run migrations if schema changed
npm run db:migrate

# Rebuild
npm run build
```







