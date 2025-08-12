
LET-COIN Presale (simulation-ready frontend)
-------------------------------------------
This package includes a simulation-mode presale frontend ready to upload to GitHub Pages.
Admin page protected by token in URL query parameter (use ?token=Ammar%20muslim).

Files:
- index.html
- admin.html (access requires ?token=Ammar%20muslim)
- script.js
- styles.css
- locales/ar.json, en.json, fr.json
- README.txt

Quick deploy on GitHub Pages:
1) Upload files to repo root on GitHub.
2) In Settings -> Pages set source to main branch / root and save.
3) Visit https://<username>.github.io/<repo>/

Security notes:
- Admin protection is client-side token in URL. Keep the URL secret.
- This is a simulation. Real transaction code is commented with TODO markers.
