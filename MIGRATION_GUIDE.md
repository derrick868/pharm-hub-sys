# Migration Guide: Lovable Cloud to Standalone Supabase

## Overview
This guide will help you migrate your Pharmacy Management System from Lovable Cloud to a standalone Supabase project.

## Prerequisites
- A Supabase account (create one at https://supabase.com)
- Access to your Lovable Cloud project

## Step 1: Create a New Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: "Pharmacy Management System"
   - Database Password: (create a strong password)
   - Region: (choose closest to your users)
5. Click "Create new project"
6. Wait for the project to be provisioned (takes ~2 minutes)

## Step 2: Import Database Schema

1. In your Supabase dashboard, go to the **SQL Editor**
2. Copy the entire contents of `database-export.sql`
3. Paste it into the SQL Editor
4. Click "Run" to execute the schema

This will create:
- All tables (profiles, user_roles, suppliers, drugs, sales, sale_items, assessments)
- Custom types (app_role enum)
- Functions (has_role, handle_new_user, update_updated_at_column)
- Triggers (for auto-updating timestamps and handling new users)
- RLS policies (for security)

## Step 3: Export Data from Lovable Cloud

Since you're currently using Lovable Cloud, you'll need to export your data. Here are SQL queries to export each table:

### Export Queries

Run these queries in the Lovable Cloud backend to get your data:

```sql
-- Export profiles
SELECT * FROM profiles;

-- Export user_roles
SELECT * FROM user_roles;

-- Export suppliers
SELECT * FROM suppliers;

-- Export drugs
SELECT * FROM drugs;

-- Export sales
SELECT * FROM sales;

-- Export sale_items
SELECT * FROM sale_items;

-- Export assessments
SELECT * FROM assessments;
```

To run these queries:
1. Use the backend access tools or SQL query interface
2. Export results as CSV or copy as JSON
3. Save each table's data separately

## Step 4: Import Data to Supabase

### Option A: Using CSV Import (Recommended for large datasets)

1. In Supabase dashboard, go to **Table Editor**
2. Select each table
3. Click "Insert" → "Import data from CSV"
4. Upload your CSV file
5. Map columns correctly
6. Click "Import"

### Option B: Using SQL INSERT Statements

For each table, create INSERT statements like:

```sql
-- Example for suppliers table
INSERT INTO public.suppliers (id, name, contact_person, email, phone, created_at, updated_at)
VALUES 
  ('uuid-1', 'Supplier Name', 'Contact Person', 'email@example.com', '123456789', '2024-01-01', '2024-01-01'),
  ('uuid-2', 'Another Supplier', 'Another Contact', 'email2@example.com', '987654321', '2024-01-01', '2024-01-01');
```

**Important**: Make sure to insert data in this order to respect foreign key relationships:
1. profiles
2. user_roles
3. suppliers
4. drugs
5. sales
6. sale_items
7. assessments

## Step 5: Configure Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email settings:
   - Enable "Confirm email" (or disable for development)
   - Set email templates if needed
4. Go to **Authentication** → **URL Configuration**
5. Add your site URL and redirect URLs

## Step 6: Update Your Application Code

Update your Supabase client configuration in your app:

```typescript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'YOUR_NEW_SUPABASE_PROJECT_URL';
const SUPABASE_PUBLISHABLE_KEY = 'YOUR_NEW_SUPABASE_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

You can find your credentials in Supabase dashboard:
- Go to **Project Settings** → **API**
- Copy "Project URL" and "anon/public key"

## Step 7: Update Environment Variables

Update your `.env` file:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
```

## Step 8: Test the Migration

1. Test authentication (sign up, sign in, sign out)
2. Test each feature:
   - Inventory management
   - POS/Sales
   - Suppliers management
   - Reports
   - Doctor assessments
3. Verify data integrity
4. Check user roles (admin vs staff)

## Step 9: Migrate Users (Optional)

If you need to migrate existing users with their passwords:

**Note**: This is complex and requires special handling. Consider:
- Option 1: Ask users to reset passwords
- Option 2: Use Supabase's bulk user import (requires access to password hashes)
- Option 3: Use temporary passwords and force password reset on first login

## Troubleshooting

### RLS Policies Not Working
- Ensure RLS is enabled: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
- Check policy definitions match exactly
- Verify user roles are assigned correctly

### Functions Not Working
- Ensure `SECURITY DEFINER` is set
- Check `search_path` is set to 'public'
- Verify function permissions

### Data Import Fails
- Check for UUID conflicts
- Ensure data types match
- Verify foreign key relationships
- Import in correct order (parent tables first)

## Data Export Helper Queries

To export your current data, you can use these queries in the backend:

### Get All Data as JSON
```sql
-- Copy each result and save as separate JSON files

-- profiles.json
SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM profiles) t;

-- user_roles.json
SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM user_roles) t;

-- suppliers.json
SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM suppliers) t;

-- drugs.json
SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM drugs) t;

-- sales.json
SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM sales) t;

-- sale_items.json
SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM sale_items) t;

-- assessments.json
SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM assessments) t;
```

## Need Help?

- Supabase Documentation: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Migration Support: https://supabase.com/docs/guides/migrations

## Checklist

- [ ] Created new Supabase project
- [ ] Imported database schema
- [ ] Exported data from Lovable Cloud
- [ ] Imported data to new Supabase project
- [ ] Configured authentication
- [ ] Updated application code with new credentials
- [ ] Updated environment variables
- [ ] Tested all features
- [ ] Verified data integrity
- [ ] Migrated or reset user passwords
- [ ] Updated deployment configuration
