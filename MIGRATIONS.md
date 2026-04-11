# Database Migration Guide

This project uses **db-migrate** for database schema versioning and management.

## Configuration

Migrations are configured in `.database.json`:
- **dev**: Local development database (localhost:3306)
- **test**: Test database
- **production**: Production database (uses environment variables)

Before running migrations, update `.database.json` with your database credentials:

```json
{
  "dev": {
    "driver": "mysql",
    "host": "localhost",
    "port": 3306,
    "database": "ktdevelop_dev",
    "user": "root",
    "password": ""
  }
}
```

## Migration Files

Migration files are stored in `/migrations` directory with the naming convention:
- `001-create-portfolios-table.js` - Create portfolios table
- `002-create-contacts-table.js` - Create contacts table
- `003-create-contact-audits-table.js` - Create contact audits table

## Commands

### Run pending migrations (development)
```bash
npm run db:migrate
```

### Rollback last migration (development)
```bash
npm run db:migrate:down
```

### Check migration status (development)
```bash
npm run db:migrate:status
```

### Run migrations (production)
```bash
npm run db:migrate:prod
```

### Create new migration
```bash
npm run db:migrate:create -- --name add_column_to_contacts
```

## Environment Variables (Production)

For production deployments, set these environment variables:
```bash
DB_HOST=your-db-host
DB_NAME=your-db-name
DB_USER=your-db-user
DB_PASSWORD=your-db-password
```

## Schema Structure

### portfolios
- `id` (INT, PK, Auto-increment)
- `title` (VARCHAR 255)
- `description` (TEXT)
- `imageUrl` (VARCHAR 500)
- `technologies` (TEXT)
- `projectUrl` (VARCHAR 500)
- `createdAt` (DATETIME)
- `updatedAt` (DATETIME)

### contacts
- `id` (INT, PK, Auto-increment)
- `name` (VARCHAR 255)
- `email` (VARCHAR 255)
- `phone` (VARCHAR 20)
- `subject` (VARCHAR 255)
- `message` (TEXT)
- `attachmentUrl` (VARCHAR 500)
- `attachmentName` (VARCHAR 255)
- `status` (VARCHAR 20, default: 'new')
- `createdAt` (DATETIME)
- `updatedAt` (DATETIME)

### contact_audits
- `id` (INT, PK, Auto-increment)
- `contactId` (INT, FK → contacts.id)
- `previousStatus` (VARCHAR 20)
- `newStatus` (VARCHAR 20)
- `changedBy` (VARCHAR 255)
- `reason` (TEXT)
- `createdAt` (DATETIME)

## Best Practices

1. **Always test migrations locally first**
   ```bash
   npm run db:migrate
   npm run db:migrate:down
   npm run db:migrate
   ```

2. **Make migrations idempotent** - They should be safe to run multiple times

3. **Keep migrations small and focused** - One logical change per migration

4. **Use meaningful names** - E.g., `add-status-column-to-contacts` instead of `fix-bug`

5. **Always provide rollback (down) implementation**

6. **Document breaking changes** in migration files

## Troubleshooting

### Connection Error
Check `.database.json` and ensure MySQL is running on the configured host/port.

### Migration Already Applied
If you see "Applied migrations up to version X":
- Migrations have already been applied
- Use `npm run db:migrate:status` to check current version

### Rollback Failed
- Ensure the migration down function is properly implemented
- Check database for orphaned tables/constraints

## Create New Migration Example

```bash
npm run db:migrate:create -- --name add_tags_table
```

This creates a new file like `004-add-tags-table.js` with template code.
