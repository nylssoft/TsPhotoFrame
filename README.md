# TsPhotoFrame

TsPhotoFrame is a digital photo frame for [stockfleth.eu](https://stockfleth.eu/), a private portal for family and friends. It displays a slideshow that adjusts to the browser window; click or tap to advance to the next photo.

This repository contains the browser application, built with TypeScript and Vite. The companion [MynaAPIServer](https://github.com/nylssoft/MynaAPIServer) handles authentication and provides the photo URLs.

## Development

For local development, start MynaAPIServer on `localhost:5000`, then run
`npm install` and `npm start`. Vite serves the app on port 8080 and proxies
`/api` and `/images` requests to the API server.

Run `npm run build` to generate the static site in `dist`. Deploy its contents
to MynaAPIServer's `wwwroot/photoframe` directory, served at `/photoframe/`.
Route same-origin `/api` and `/images` requests to MynaAPIServer.

## License

Copyright (c) 2024-2026 Niels Stockfleth. Licensed under GPL-3.0-only; see
[LICENSE](LICENSE).
