# KeyCheck

KeyCheck is a MicroSaaS application that scans GitHub repositories for exposed secrets (API keys, tokens, etc.) and provides AI-powered remediation instructions using `git filter-repo`.

## Features

-   **Scan Repositories**: Enter a GitHub repository URL to scan for secrets.
-   **Secret Detection**: Uses regex patterns to identify AWS keys, Stripe keys, OpenAI keys, and more.
-   **AI Remediation**: Uses OpenAI to generate specific `git filter-repo` commands to remove secrets from history.
-   **Secure**: Runs locally or can be deployed.

## Getting Started

### Prerequisites

-   Node.js 18+
-   OpenAI API Key (for remediation features)
-   GitHub Token (optional, for higher rate limits)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/keycheck.git
    cd keycheck
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up environment variables:
    Copy `.env.example` to `.env.local` and fill in your keys.
    ```bash
    cp .env.example .env.local
    ```

4.  Run the development server:
    ```bash
    npm run dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1.  Enter a public GitHub repository URL (e.g., `https://github.com/username/repo`).
2.  Click "Scan Repository".
3.  Review the findings.
4.  Click "How to fix this?" to get detailed instructions on removing the secret using `git filter-repo`.

## Tech Stack

-   **Framework**: Next.js 14 (App Router)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS
-   **AI**: OpenAI API
-   **GitHub API**: Octokit

## License

MIT
