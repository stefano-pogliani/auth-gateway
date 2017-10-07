0.2.5
-----
* Add missing `prom-client` dependency.
* Encode hashed IDs with base64 (not hex).
* Support `version` command and `--version` flag.

0.2.4
-----
* AuthGateway logo.
* Acmetool integration.
* Reload Auth and HTTP proxy (for certs update and logrotate).

0.2.3
-----
* Expose metrics.

0.2.2
-----
* Audit report builder.
* Update package version.

0.2.1
-----
* Docker-based demo (with docker compose).
* Simple HTTP Push recevier.

0.2.0
-----
* Convert callbacks to promises (breaking).
* HTTP POST auditor.
* Remove old portal prototype.

0.1.7
-----
* Add session ID to /api/proxied/session.
* Auditor subsystem.
* Build request context.
* Render user profile information.

0.1.6
-----
* Have HTTP Proxy redirect to the protal.
* Use session information to determine /api/auth return code.

0.1.5
-----
* Detect path being authenticated.
* HTTP Proxy (nginx) checks /api/auth for proxied requests.
* Started /api/auth to always allow.

0.1.4
-----
* Added empty profile page.
* Show message that no apps are available.
* Show user dropdown in navbar.

0.1.3
-----
* Pass user session to index template.
* User session endpoint.

0.1.2
-----
* Generate Auth proxy configuration (oauth2).
* Implement login flow.
* Self signed HTTPS for tests.
* Start Auth proxy to authenticate requests.
* TLS termination at HTTP proxy.

0.1.1
-----
* Core backend API server.
* Have the proxy serve WebUI statics.
* Web portal nav and home page.

0.1.0
-----
* Generate HTTP(S) proxy configuration (nginx).
* Yaml based configuration file (to override defaults).
* Start HTTP(S) proxy to serve apps and portal.

0.0.0
-----
* Prototype web UI.
