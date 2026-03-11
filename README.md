# Notes Management API

A backend REST API built with **Express.js**, **SQLite**, and **JWT** for managing personal notes with authentication and role-based access control made by @neuralsin

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Copy the example env file and fill in your values:
   ```
   copy .env.example .env
   ```

3. Start the server:
   ```
   npm start
   ```

The server runs on `http://localhost:3000` by default bt can be changed in the .env file.

---

## API Endpoints

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive a JWT |

### Notes (requires token)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notes` | Get your notes (supports `?page=`, `?limit=`, `?search=`) |
| POST | `/api/notes` | Create a new note |
| GET | `/api/notes/:id` | Get a single note |
| PUT | `/api/notes/:id` | Update a note |
| DELETE | `/api/notes/:id` | Delete a note |

### Admin only (requires admin token)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notes/admin/all` | View all notes from all users |
| DELETE | `/api/notes/admin/:id` | Delete any note |

---

## Authentication

Include the token in every protected request:
```
Authorization: Bearer <your_token_here>
```

---

## Example Requests

**Register**
```json
POST /api/auth/register
{
  "username": "shaan",
  "email": "ss6767@gmaul.com",
  "password": "secret123"
}
```

**Login**
```json
POST /api/auth/login
{
  "email": "ss6767@gmaul.com",
  "password": "secret123"
}
```

**Create a note**
```json
POST /api/notes
{
  "title": "Shopping List",
  "content": "Milk, Eggs, Bread"
}
```

**Search notes**
```
GET /api/notes?search=shopping&page=1&limit=5
```

---

## User Roles

- **user** — can only create, view, update, and delete their own notes
- **admin** — can view and delete all notes from all users

To create an admin, set `"role": "admin"` in the register request body.
