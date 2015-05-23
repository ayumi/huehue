# HueHue

Minimal JS Frontend for the Philips Hue API.

# Usage

Run a static HTTP server and open index.html in your browser.

Default API endpoint is `:80/api/anykey` on whatever host is serving the file. This is configured in `hue.js`.

Change by setting the query param `api_root`, e.g. `?api_root=//some-other-host.local/api/key`.

# Deployment

The included Dockerfile builds an nginx image (~100MiB) which serves this directory.

# License

MIT
