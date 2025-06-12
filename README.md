
# StudySmarts: AI-Powered Learning Assistant (Next.js)

https://studysmarts.vercel.app/
This is a Next.js application, StudySmarts, built to help users process and understand textual information using AI-driven summaries and quizzes.

## Getting Started Locally

1.  **Prerequisites**:
    *   Node.js (LTS version recommended) and npm (or yarn).
    *   VS Code (or your preferred code editor).

2.  **Clone/Download the Repository**:
    Get the project files onto your local machine.

3.  **Install Dependencies**:
    Open a terminal in the project's root directory and run:
    ```bash
    npm install
    ```
    (or `yarn install` if you use yarn)

4.  **Set Up Environment Variables (for AI Features)**:
    *   Create a file named `.env` in the root of the project.
    *   Add your `GOOGLE_API_KEY` (if using Google AI for Genkit):
        ```env
        GOOGLE_API_KEY=your_actual_google_ai_api_key
        ```

5.  **Run the Development Servers**:
    *   **Next.js App (Frontend)**: In one terminal, run:
        ```bash
        npm run dev
        ```
        This usually starts the app on `http://localhost:9002`.
    *   **Genkit Server (AI Backend)**: In a *separate* terminal, run:
        ```bash
        npm run genkit:dev
        ```
        (or `npm run genkit:watch` for auto-reloading Genkit flows)
        This usually starts the Genkit server on `http://localhost:3400`.

6.  **Access the App**:
    Open your browser and go to `http://localhost:9002`.

## Building for Static Export and Deployment

This project is configured for static export, suitable for platforms like GitHub Pages, Vercel, Netlify, etc.

1.  **Build the Project**:
    Run the following command in your terminal:
    ```bash
    npm run build
    ```
    This command will:
    *   Build the Next.js application.
    *   Because `output: 'export'` is set in `next.config.ts`, it will automatically export your site into an `out` directory in your project root.

2.  **Deploying the `out` Directory**:
    The contents of the `out` directory are what you need to deploy to your static hosting provider.

    **Specifically for GitHub Pages**:
    *   **If you see this README.md file on your live GitHub Pages site instead of the actual application, it means GitHub Pages is NOT serving from the `out` directory.**
    *   **How to Fix on GitHub Pages**:
        *   **Using GitHub Actions (Recommended)**:
            *   Create a workflow file (e.g., `.github/workflows/deploy.yml`).
            *   This workflow should:
                1.  Checkout your code.
                2.  Set up Node.js.
                3.  Install dependencies (`npm install`).
                4.  Run the build command (`npm run build`).
                5.  Configure an action (like `actions/upload-pages-artifact` and `actions/deploy-pages`) to use the `./out` folder as the source for deployment.
            *   Ensure your repository settings under "Pages" are set to deploy from "GitHub Actions".
        *   **Deploying from a Branch (Older Method)**:
            *   You could push the *contents* of the `out` directory to a specific branch (e.g., `gh-pages`).
            *   Then, in your repository settings under "Pages", select the `gh-pages` branch and the `/ (root)` folder as the source.
    *   **Base Path for GitHub Pages**: If your repository is named `your-repo-name` and your site is served at `https://yourusername.github.io/your-repo-name/`, you **must** also configure `basePath` in your `next.config.ts`:
        ```javascript
        // next.config.ts
        const nextConfig = {
          output: 'export',
          basePath: '/your-repo-name', // IMPORTANT: Replace 'your-repo-name'
          images: {
            unoptimized: true,
          },
          // ... other settings
        };
        export default nextConfig;
        ```
        After adding/changing `basePath`, you need to `npm run build` again and redeploy. You'll also need to make sure your links and image sources in the application correctly account for this base path (Next.js's `<Link>` and `<Image>` components usually handle this well if `basePath` is set).

## Key Files to Look At

*   `src/app/page.tsx`: The main entry point for the application's UI.
*   `src/components/study-smarts/StudySmartsPage.tsx`: The core component handling most of the page logic.
*   `src/context/StudyContext.tsx`: Manages shared state for user roles and quiz data.
*   `src/ai/flows/`: Contains the Genkit AI flow definitions.
*   `next.config.ts`: Next.js configuration, including static export settings.

---

This README should be more helpful. Remember, the crucial step is to ensure your GitHub Pages (or other static host) deployment process is configured to use the **`out` directory** that `npm run build` generates.
