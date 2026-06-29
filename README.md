# Smart Internal Complaint Management Portal

An enterprise-ready, AI-powered Internal Complaint & Issue Management System. Built using Next.js (App Router), React, Express, TypeScript, Prisma, and PostgreSQL.

## Features

- **Employee Portal**: Create, edit (before assignment), track, comment on, and view a timeline of department complaints. Supports uploading images, PDFs, Excel, and Word files. Built-in AI Chat Assistant to help resolve common issues.
- **Admin Dashboard (IT Department)**: Manage all complaints (assign engineers, add internal/public notes, close/delete/restore complaints), view real-time department analytics, export reports to Excel/PDF, and view system audit/activity logs.
- **AI Integrations**: Automated classification (category prediction), automated priority prediction, ticket summaries, duplicate ticket suggestions, AI Chat Assistant for troubleshooting, and predictive analytics for recurring department-level issues.
- **Security & Infrastructure**: Fully typed TypeScript architecture, JWT-based secure authentication with cookie-stored refresh tokens, rate limiting, helmet security, and containerization via Docker.

## Project Structure

```
PROJECT/
├── docker-compose.yml
├── README.md
├── .gitignore
├── backend/                  # Express, TypeScript, Prisma & PostgreSQL Backend
└── frontend/                 # Next.js App Router, React, Tailwind & Shadcn Frontend
```

## Getting Started

Detailed startup steps for backend, frontend, database migration, and docker-compose configurations will be populated under respective project phases.
