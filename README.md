## Setup instructions

### 1. Clone the repository

```bash
git clone <repo-url>
cd artist_management_system
```

### 2. Install dependencies

```bash
npm install
```

### 3. Database Setup

Create a new PostgreSQL database (e.g., `artist_management`).
Run the schema script to create tables:

```bash
psql -U your_username -d artist_management -f schema.sql
```

### 4. Environment configuration

Copy `.env.example` to `.env` and add necessary values

### 5. Running the application

Start the server:

```bash
npm start
```

### 6. Seed the database

Generate initial data for testing:

```bash
npm run seed
```

This will generate default super admin credentials as:
**Email**: `admin@example.com`
**Password**: `admin123`
