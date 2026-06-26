# Library Access Portal v2 Setup

This folder is the shared-database version of the Library Access Portal.

The original `site/` folder remains the stable static app. This v2 app keeps a local fallback, so it still opens even before Supabase is configured.

## What Changes in v2

- Students can still search without login.
- Teachers sign in with Supabase email/password.
- Teacher edits are saved to Supabase.
- Newly added books are saved to Supabase.
- Everyone sees shared updates after the database is connected.

## Setup Steps

1. Create a Supabase project.
2. Open Supabase SQL Editor.
3. Run `supabase/schema.sql`.
4. Create teacher users in Supabase Authentication.
5. Insert each teacher into `library_profiles`.

Example:

```sql
insert into public.library_profiles (user_id, email, role)
values ('PASTE-AUTH-USER-ID-HERE', 'teacher@example.com', 'teacher');
```

6. Generate the record import CSV:

```powershell
python supabase/make_seed_csv.py
```

7. In Supabase Table Editor, import:

```text
outputs/supabase_library_records_seed.csv
```

into table:

```text
library_records
```

8. Copy Supabase project URL and anon public key into:

```text
site_supabase/config.js
```

9. Test locally:

```powershell
cd site_supabase
python -m http.server 8018
```

Open:

```text
http://127.0.0.1:8018
```

10. After testing, deploy `site_supabase/` to Vercel or replace the static root only when ready.

## Safety

Do not replace the current Vercel app until v2 is tested with:

- shared database loading,
- student search,
- teacher login,
- edit existing book,
- add new book,
- reload page and confirm the changes remain visible.
