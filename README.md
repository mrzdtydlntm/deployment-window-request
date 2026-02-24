# Deployment Window Calendar App
A modern, beautiful, full-stack Next.js application built to seamlessly manage and track scheduled deployment windows via an interactive calendar interface.

## Tech Stack
- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Language**: TypeScript
- **Package Manager**: `pnpm`
- **Styling**: Vanilla CSS (Custom Glassmorphism + Dark Mode theme)
- **Database**: PostgreSQL (specifically built for [Neon Serverless Postgres](https://neon.tech))
- **ORM**: [Sequelize](https://sequelize.org/)

## Application Features
- **Dynamic Calendar View**: View requested deployment windows intuitively laid out in a month-by-month calendar view with quick badging indicators.
- **Request Management**: Add, Edit, and Delete deployment requests with zero-hassle. 
- **Required Validations**: Enforces requirements for `Title`, `Time`, `Team Issuer`, and `Issuer Name`.
- **References**: Attach custom MoP Links (URLs) to your deployments. *(File uploads were removed in favor of direct Links to ensure seamless serverless hosting).*
- **Elegant UI**: Completely custom glassmorphic styling.
- **Instant Feedback**: Beautiful "Toaster" notifications alert you on successful additions, updates, or deletions.
- **Safety Checks**: Preventing accidental wipes by requiring title-confirmation matching before deleting any deployment.

## Prerequisites
Ensure your local development environment has the following installed:
1. **Node.js**: v24.13.0 or higher.
2. **Package Manager**: [pnpm](https://pnpm.io/installation)
3. **Database**: A PostgreSQL database connection string (Neon DB is recommended).

## Setup & Local Development

1. **Clone the repository** and navigate to the project root:
   ```bash
   cd deployment-window
   ```

2. **Install dependencies** using `pnpm`:
   ```bash
   pnpm install
   ```

3. **Environment Setup**:
   Create a `.env.local` file at the root of the project to hold your database credentials:
   ```env
   DATABASE_URL="postgres://user:password@ep-your-neon-db.region.aws.neon.tech/neondb?sslmode=require"
   ```
   *Note: If `DATABASE_URL` is omitted, the application will attempt to fallback to a local instance at `postgres://postgres:postgres@localhost:5432/deployment_window`.*

4. **Run the Development Server**:
   ```bash
   pnpm dev
   ```
   *The database schema (tables) will automatically synchronize on the first startup/API request.*

5. **Open your browser** and visit `http://localhost:3000`.

## Deployment (Netlify)
This project is configured out-of-the-box for serverless deployments on Netlify.
Since it stores references to external links (MoP links) rather than relying on an ephemeral server filesystem, no complicated blob-storage setups are required!

1. Push your repository to your Git provider (GitHub/GitLab).
2. Create a New Site in your Netlify Dashboard and link your repository.
3. Configure **Environment Variables**: Add your `DATABASE_URL` in the Netlify settings.
4. Deploy! The `netlify.toml` file will automatically define the build commands (`pnpm build`).
