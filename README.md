# Terraform Quiz

This repository contains a simple static quiz app.

Files of interest:
- `index.html` — the web app entry page.
- `terraform_questions_20251015_233257.json` — the quiz questions JSON.

How to open the app

1. Open directly in a browser (NOT recommended for some browsers):

   - Double-click `index.html` to open it in your default browser.

   Note: Some browsers block `fetch` requests to local files for security. If the app doesn't load the questions, use the local server method below.

2. Serve with a simple local HTTP server (recommended):

   - Python 3 (if installed):

     ```bash
     # from the project root
     python3 -m http.server 8000
     # then open http://localhost:8000 in your browser
     ```

   - Node.js (if installed):

     ```bash
     # from the project root
     npx http-server -p 8000
     # then open http://localhost:8000 in your browser
     ```

How the app imports the JSON

- The app expects the JSON file `terraform_questions_20251015_233257.json` to be in the same directory as `index.html`.
- When served over HTTP, the app will fetch that JSON (e.g. `fetch('terraform_questions_20251015_233257.json')`) and load the questions.

If you need the JSON hosted elsewhere (CORS), either configure the server to allow CORS or update the `fetch()` URL in `app.js` to point to the remote URL.

Commit & push

- I can commit this README and push it to the remote `origin/main`. If you'd like that, say "commit and push README" and I'll do it for you.

Troubleshooting

- If questions don't load, open the browser console (F12) and look for network errors or CORS issues.
- Ensure you're serving files over HTTP if `fetch` to local file is blocked.

Enjoy!
