# Library Management Web App

A simple web-based application created to organize and manage library book records in a structured and accessible format.

## Project Overview

This project was developed to digitize and display library book details such as accession number, book title, author, publication, edition, year, source of purchase, and shelf/rack location.

The web app helps users quickly view and access library book records without depending only on physical registers.

## Features

* Displays library book records in a clean format
* Includes details such as:

  * Accession number
  * Book title
  * Author
  * Publication
  * Edition/volume
  * Year
  * Source of purchase
  * Shelf/rack location
* Easy to update and maintain
* Deployed online using Vercel
* Accessible through QR code

## Tech Stack

* HTML
* CSS
* JavaScript
* GitHub
* Vercel

## Deployment

The project is deployed using Vercel.

Any updates pushed to the connected GitHub repository will automatically trigger a new deployment on Vercel.

## Shared Database v2

The current root files are the stable static app.

The `v2/` folder contains the Supabase-ready shared database version. It keeps a local fallback until Supabase is configured, so it can be tested without breaking the current live app.

Use these files for v2 setup:

* `v2/README_SETUP.md`
* `v2/config.js`
* `supabase/schema.sql`
* `supabase/make_seed_csv.py`

After Supabase is connected, teacher edits and newly added books can be saved to the shared database and become visible to everyone.

## How to Update the Website

1. Make changes in the project files.
2. Save the changes.
3. Open terminal in the project folder.
4. Run:

```bash
git add .
git commit -m "Update website"
git push origin main
```

5. Wait for Vercel deployment to complete.
6. Open the same website link or scan the existing QR code to view the updated version.

## Purpose

This web app was created as a digital support system for library record management, making book information easier to access, update, and share.

## Author

Created by Mousufa.
