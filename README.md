# Budget Tracker AST 📊

A sophisticated MERN-stack application (PostgreSQL, Express, React, Node.js) designed for seamless budget management, expense tracking, and financial transaction recording. This project features a robust containerized database setup and a comprehensive Selenium-based UI automation testing suite.

## 🚀 Quick Start Guide

### 1. Prerequisites
Ensure you have the following installed on your machine:
*   **Node.js** (v18 or higher)
*   **pnpm** (preferred package manager)
*   **Docker Desktop** (for PostgreSQL container)
*   **Java Runtime** (required only for Selenium Server Grid testing)

### 2. Initial Setup
Clone the repository and install dependencies in all modules:

```bash
# Install root (if any) and submodule dependencies
pnpm install

# Setup Backend
cd backend
pnpm install

# Setup Frontend
cd ../frontend
pnpm install

# Setup Selenium Tests
cd selenium-tests
pnpm install
```

### 3. Environment Configuration
Create a `.env` file in the `backend` directory (or use the existing one):

```env
DATABASE_URL=postgresql://admin:admin@localhost:5432/mydb
JWT_SECRET=your_super_secret_key
```

---

## 🛠 Running the Application

### Phase 1: Database (Docker)
We use Docker to ensure a consistent PostgreSQL environment.
```bash
# In /backend
pnpm run docker:up
```

### Phase 2: Schema Migration
Sync your database tables with Drizzle ORM:
```bash
# In /backend
pnpm run db:push
```

### Phase 3: Start Services
Run both backend and frontend in separate terminals:

**Backend:**
```bash
cd backend
pnpm run dev
```

**Frontend:**
```bash
cd frontend
pnpm run dev
```

---

## 🧪 Testing Suite

### Unit & Integration Testing (Backend)
Tests for controllers and services using Jest.
```bash
# In /backend
pnpm test
```

### UI Automation (Selenium)
Comprehensive end-to-end tests for registration, login, and dashboard workflows.

**Note:** For running Grid-based tests (`test:grid`), ensure `selenium-server.jar` is present in the `frontend/selenium-tests` folder and Java is installed.

```bash
cd frontend/selenium-tests

# Run standard tests
pnpm test

# Run tests using Selenium Grid (Parallel execution)
pnpm run test:grid
```

---

## 📜 Command Reference

| Module | Command | Description |
| :--- | :--- | :--- |
| **Backend** | `pnpm run dev` | Start Express server with nodemon |
| **Backend** | `pnpm run docker:up` | Start PostgreSQL container |
| **Backend** | `pnpm run db:push` | Push schema changes to DB |
| **Frontend** | `pnpm run dev` | Start Vite development server |
| **Selenium** | `pnpm test` | Execute Mocha/Selenium UI tests |

## 🏗 Project Structure
*   `backend/`: Express API, Drizzle ORM, and Docker config.
*   `frontend/`: React + Vite application with Tailwind CSS.
*   `frontend/selenium-tests/`: Industrial-grade QA automation suite.

---
*Created for Advanced Software Testing (AST) Project*
