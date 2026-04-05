# Backend Setup — Google Sheets & Apps Script

This document explains how to set up and configure the Google Sheets + Apps Script backend that powers the IEEE Benefits Explorer's live data and crowdsourced contribution system.

---

## Table of Contents

- [Overview](#overview)
- [Google Sheet Setup](#google-sheet-setup)
  - [Creating the Sheet](#creating-the-sheet)
  - [Sheet Structure](#sheet-structure)
  - [Column Reference](#column-reference)
  - [Important Rules](#important-rules)
- [Google Apps Script Setup](#google-apps-script-setup)
  - [Creating the Script](#creating-the-script)
  - [The Code](#the-code)
  - [Deploying as a Web App](#deploying-as-a-web-app)
  - [Updating the Deployment](#updating-the-deployment)
- [API Reference](#api-reference)
  - [GET — Fetch Benefits](#get--fetch-benefits)
  - [POST — Submit a Contribution](#post--submit-a-contribution)
- [Connecting to the Frontend](#connecting-to-the-frontend)
- [Administration & Moderation](#administration--moderation)
- [Troubleshooting](#troubleshooting)

---

## Overview

The backend is intentionally simple and serverless:

```
Google Sheet ("data" tab)
    │
    ├── Stores all benefits data (one row per benefit)
    ├── Acts as both database and admin panel
    │
    └── Google Apps Script (Web App)
            │
            ├── doGet()  → Returns benefits as JSON (with optional filters)
            └── doPost() → Appends new contributions as pending entries
```

**Why Google Sheets?**
- Zero infrastructure cost
- Easy for non-technical maintainers to review, edit, and approve entries
- Built-in version history and access control
- The Apps Script web app provides a simple REST-like API

---

## Google Sheet Setup

### Creating the Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet.
2. Rename the default sheet tab to **`data`** (this is critical — the Apps Script looks for this exact name).
3. Set up the header row (Row 1) with the column names listed below.

### Sheet Structure

The sheet must have a tab named **`data`** with the following columns as headers in **Row 1**:

| Column | Header                    | Example Value                                     |
| ------ | ------------------------- | ------------------------------------------------- |
| A      | `id`                      | `AES010-awards-best-paper`                        |
| B      | `title`                   | Best Paper Award                                  |
| C      | `description`             | Recognizes the best paper published in...          |
| D      | `category`                | Awards                                            |
| E      | `url`                     | `https://example.ieee.org/award`                  |
| F      | `spoName`                 | IEEE Aerospace and Electronic Systems Society     |
| G      | `date`                    | *(empty or text like "Announcing Soon")*          |
| H      | `deadline`                | 2026-05-15                                        |
| I      | `status`                  | Active                                            |
| J      | `verified`                | TRUE                                              |
| K      | `ieeeMembershipRequired`  | TRUE                                              |
| L      | `student`                 | FALSE                                             |
| M      | `annual`                  | TRUE                                              |
| N      | `createdByName`           | Top Contributor                                          |
| O      | `createdByEmail`          | top.contributor@ieee.org                                 |
| P      | `createdAt`               | 2026-04-01T12:00:00.000Z                          |

> **Note:** The header names must match exactly (they are case-sensitive). The Apps Script uses Row 1 headers to map data to JSON keys.

### Column Reference

| Field                     | Type        | Required | Description                                                                                    |
| ------------------------- | ----------- | -------- | ---------------------------------------------------------------------------------------------- |
| `id`                      | String      | Yes      | Unique ID. For contributions, auto-generated as `{hiddenSpoId}-{category-slug}-{title-slug}`. |
| `title`                   | String      | Yes      | Display title for the benefit.                                                                 |
| `description`             | String      | Yes      | Brief description (recommended max 500 characters).                                            |
| `category`                | String      | Yes      | Must match a category title from `categories.json` (e.g., `Awards`, `Competitions`).           |
| `url`                     | String      | Yes      | Primary URL linking to more info.                                                              |
| `spoName`                 | String      | Yes      | The IEEE organizational unit name. Must match a `spoName` from `spos.json`.                    |
| `date`                    | String/Null | No       | Event date or descriptive text.                                                                |
| `deadline`                | String/Null | No       | Application deadline. **Must be `YYYY-MM-DD` format** (no time component).                     |
| `status`                  | String      | Yes      | `Active` = visible to users, `pending` = awaiting moderation.                                  |
| `verified`                | Boolean     | Yes      | `TRUE` = approved by maintainer. Only `verified=true` entries are fetched by the frontend.     |
| `ieeeMembershipRequired`  | Boolean     | Yes      | Whether IEEE membership is strictly required.                                                  |
| `student`                 | Boolean     | Yes      | Whether the benefit is only available to students.                                             |
| `annual`                  | Boolean     | Yes      | Whether this is a recurring annual opportunity.                                                |
| `createdByName`           | String      | No       | Contributor's name (for crowdsourced submissions).                                             |
| `createdByEmail`          | String      | No       | Contributor's email (for follow-up on annual entries).                                         |
| `createdAt`               | String      | No       | ISO timestamp auto-set by the Apps Script on submission.                                       |

### Important Rules

1. **`deadline` format**: Always use `YYYY-MM-DD` (e.g., `2026-05-15`). Do **not** include a timestamp suffix like `T23:59:59Z`. This prevents timezone-related display inconsistencies for global users.

2. **`spoName` values**: Must exactly match one of the `spoName` values from `spos.json`. The Contribute form uses a dropdown populated from this file.

3. **`category` values**: Must match a `title` from `categories.json`. Mismatches will cause the entry to not show up under any category filter.

4. **Moderation flow**: All new contributions via the API are automatically set to `status: "pending"` and `verified: false`. A maintainer must manually change these in the Sheet to `Active` / `TRUE` for the entry to appear on the platform.

---

## Google Apps Script Setup

### Creating the Script

1. Open your Google Sheet.
2. Go to **Extensions → Apps Script**.
3. This opens the Apps Script editor bound to your spreadsheet.
4. Replace the default `Code.gs` content with the code from [`appscript/Code.gs.js`](./appscript/Code.gs.js) in this repo.

> **Tip:** A copy of the Apps Script code is kept in `appscript/Code.gs.js` as a version-controlled reference. The actual running code lives in the Apps Script editor.

### The Code

The Apps Script provides two HTTP handlers:

#### `doGet(e)` — Read benefits

```javascript
const SHEET_NAME = 'data';

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);

  let results = rows.map(row => {
    let obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });

  // Filtering based on query parameters
  const params = e.parameter;
  const filterKeys = ['spoName', 'category', 'status', 'verified',
                       'ieeeMembershipRequired', 'student', 'annual'];

  filterKeys.forEach(key => {
    if (params[key] !== undefined) {
      results = results.filter(row => String(row[key]) === String(params[key]));
    }
  });

  return ContentService.createTextOutput(JSON.stringify(results))
    .setMimeType(ContentService.MimeType.JSON);
}
```

#### `doPost(e)` — Submit a contribution

```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const headers = sheet.getDataRange().getValues()[0];

    if (typeof e.postData === 'undefined') {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: 'No post data' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const body = JSON.parse(e.postData.contents);

    // Auto-fill enforced fields (security)
    body.status = 'pending';
    body.verified = false;
    body.createdAt = new Date().toISOString();

    const newRow = headers.map(header => body[header] !== undefined ? body[header] : "");
    sheet.appendRow(newRow);

    return ContentService.createTextOutput(
      JSON.stringify({ success: true, id: body.id })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
```

**Key security detail:** The `doPost` handler **always** forces `status: 'pending'` and `verified: false` regardless of what the client sends. This prevents anyone from injecting verified entries directly through the API.

### Deploying as a Web App

1. In the Apps Script editor, click **Deploy → New deployment**.
2. Click the gear icon (⚙️) next to "Select type" and choose **Web app**.
3. Configure:
   - **Description**: e.g., `"IEEE Benefits API v1"`
   - **Execute as**: `Me` (your Google account)
   - **Who has access**: `Anyone` (this makes it a public API — required for the frontend to access it without authentication)
4. Click **Deploy**.
5. **Copy the Web App URL** — it looks like:
   ```
   https://script.google.com/macros/s/AKfycby.../exec
   ```
6. Paste this URL as the `APP_SCRIPT_URL` in your `.env` file.

> **⚠️ Important:** Every time you edit the Apps Script code, you must create a **new deployment** (or update the existing one) for changes to take effect on the live URL.

### Updating the Deployment

1. Make your changes in the Apps Script editor.
2. Click **Deploy → Manage deployments**.
3. Click the pencil (✏️) icon on your active deployment.
4. Change the **Version** dropdown to `New version`.
5. Click **Deploy**.

The URL remains the same, and the new code is now live.

---

## API Reference

All requests are made to the deployed Web App URL (`APP_SCRIPT_URL`).

### GET — Fetch Benefits

Retrieves benefits from the Google Sheet, optionally filtered by query parameters.

**Endpoint:**
```
GET {APP_SCRIPT_URL}?{query_params}
```

**Supported Query Parameters:**

| Parameter                 | Type   | Example             | Description                                  |
| ------------------------- | ------ | ------------------- | -------------------------------------------- |
| `verified`                | string | `true`              | Filter by verification status                |
| `status`                  | string | `Active`            | Filter by status                             |
| `category`                | string | `Awards`            | Filter by category name                      |
| `spoName`                 | string | `IEEE Computer Society` | Filter by organization unit               |
| `ieeeMembershipRequired`  | string | `true`              | Filter by membership requirement             |
| `student`                 | string | `true`              | Filter by student eligibility                |
| `annual`                  | string | `true`              | Filter by annual recurrence                  |

> All filter values are matched as **strings** (e.g., pass `true`/`false`, not boolean). Multiple parameters can be combined.

**Example Requests:**

```bash
# Fetch all verified benefits
curl "{APP_SCRIPT_URL}?verified=true"

# Fetch verified awards only
curl "{APP_SCRIPT_URL}?verified=true&category=Awards"

# Fetch student-only competitions
curl "{APP_SCRIPT_URL}?verified=true&category=Competitions&student=true"

# Fetch all benefits from a specific IEEE society
curl "{APP_SCRIPT_URL}?verified=true&spoName=IEEE%20Computer%20Society"
```

**Response:**
```json
[
  {
    "id": "award-1",
    "title": "Larry K. Wilson Regional Student Activities Award",
    "description": "...",
    "category": "Awards",
    "url": "https://...",
    "spoName": "MGA Student Activities Committee",
    "date": null,
    "deadline": "2026-04-15",
    "status": "Active",
    "verified": true,
    "ieeeMembershipRequired": true,
    "student": true,
    "annual": true
  }
]
```

**How the frontend uses it:**
The `fetchBenefits()` function in `src/services/api.js` calls `{APP_SCRIPT_URL}?verified=true` to fetch only verified entries. This is the primary data source — local JSON files are fallbacks only.

---

### POST — Submit a Contribution

Appends a new benefit entry to the Google Sheet.

**Endpoint:**
```
POST {APP_SCRIPT_URL}
```

**Headers:**
```
Content-Type: text/plain;charset=utf-8
```
> Note: `text/plain` is used instead of `application/json` to avoid CORS preflight issues with Google Apps Script.

**Request Body (JSON string):**

```json
{
  "id": "AES010-awards-best-paper",
  "spoName": "IEEE Aerospace and Electronic Systems Society",
  "category": "Awards",
  "title": "Best Paper Award",
  "description": "Recognizes the best paper published in...",
  "url": "https://example.ieee.org/award",
  "date": "",
  "deadline": "2026-12-31",
  "ieeeMembershipRequired": true,
  "student": false,
  "annual": true,
  "createdByName": "Top Contributor",
  "createdByEmail": "top.contributor@ieee.org"
}
```

> **Note:** The `status`, `verified`, and `createdAt` fields are **ignored** from the client payload. The server enforces:
> - `status` → `"pending"`
> - `verified` → `false`
> - `createdAt` → current ISO timestamp

**Success Response:**
```json
{
  "success": true,
  "id": "AES010-awards-best-paper"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error description"
}
```

---

## Connecting to the Frontend

After deploying the Apps Script:

1. Copy the Web App URL.
2. Set it in your project's `.env` file:
   ```env
   APP_SCRIPT_URL=https://script.google.com/macros/s/AKfycby.../exec
   ```
3. Restart the dev server (`npm run dev`).

The frontend will now:
- **Read** from the Apps Script on every page load (fetching `?verified=true`).
- **Write** to the Apps Script when a user submits the Contribute form.

If the environment variable is not set, the app gracefully falls back to `public/data.json` → `public/data.example.json`.

---

## Administration & Moderation

### Approving Contributions

1. Open the Google Sheet.
2. New contributions appear at the bottom with `status = pending` and `verified = FALSE`.
3. Review the entry:
   - Verify the URL is legitimate.
   - Check that `spoName` and `category` match valid values.
   - Confirm the description is accurate.
4. To approve: change `status` to `Active` and `verified` to `TRUE`.
5. The entry will appear on the platform on the next page load.

### Editing Existing Entries

You can directly edit any cell in the Google Sheet. Changes are reflected immediately on the next API fetch (no redeployment needed).

### Removing Entries

To hide an entry without deleting it, set `verified` to `FALSE` or `status` to anything other than `Active`. To permanently remove it, delete the row.

### Access Control

- **Sheet editors**: Anyone with edit access to the Google Sheet can moderate entries.
- **Apps Script**: Only the owner (the person who deployed it) can modify the script. Others need to be added as editors in the Apps Script project.
- **API consumers**: The deployed Web App is public (`Anyone` access), but POST submissions are always forced to `pending` status.

---

## Troubleshooting

| Problem                                        | Solution                                                                                                    |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| API returns HTML instead of JSON               | The deployment likely expired or was deleted. Re-deploy from Apps Script editor.                             |
| CORS errors in browser console                 | Ensure you're using `text/plain` content type for POST requests, not `application/json`.                    |
| New contributions not showing on the platform  | Check that `status` is `Active` and `verified` is `TRUE` in the Sheet.                                     |
| Environment variable not working               | Restart the dev server after editing `.env`. Ensure the variable name is exactly `APP_SCRIPT_URL`.          |
| Data appears stale                             | The app caches data in `localStorage`. Clear it via DevTools → Application → Local Storage, then refresh.   |
| Sheet tab not found error                      | Ensure the Google Sheet has a tab named exactly `data` (lowercase).                                        |
| POST request returns "No post data"            | Ensure the request body is a JSON string sent as `text/plain`.                                             |
