# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Configurable headers for request information.

### Fix
- OAuth2Proxy Authenticator marks request to the proxy resources as `PreAuth` allowed.

## [0.5.0] - 2021-12-04
### Added
- Dockerfile and distroless image.
- Kubernetes deployment example.
- Rules engine and rules files.

### Changed
- Rewrite in rust.
- Update audit-reporter tool in line with new data schema.

### Removed
- **BREAKING**: Apps configuration (users must configure the HTTPS Proxy).
- **BREAKING**: Process supervision of HTTP(S) and authentication proxies (users must run these processes).
- **BREAKING**: WebUI and applications catalogue.

## [0.4.6] - 2020-02-28
### Changed
- **Actually** fix oauth2_proxy configuration template.

## [0.4.5] - 2020-02-18
### Changed
- Fix oauth2_proxy configuration template to work with v5.0.
- Upgrade dependencies.

## [0.4.4] - 2018-08-27
### Changed
- Minor dependencies updates.

### Fixed
- The audit report generator (after MongoDB driver update).

## [0.4.3] - 2018-08-11
### Changed
- Added audited apps to output of list-domains.
- Start using "Keep a Changelog" format.
- Upgrade dependencies.

## 0.4.2
- Add advanced HTTP proxy options for audited apps.

## 0.4.1
- Add robots.txt to deny all.
- Suppot advanced HTTP proxy options for apps.
- Suppot client max body size advanced option.

## 0.4.0
- Refactor configuration to be a class.
- Support whitelisted paths for protected apps.

## 0.3.0
- Add /api/audit endpoint.
- Add session type (cookie only for now).
- Define audit record format and helper functions.
- Define authorization rules in a dedicated module.
- Introduce app ids (for upstream names).
- Introduce audited apps.
- Pass configuration to enhanceApp.
- Prepare HTTP context and template for audited apps.
- Shared logic to audit requests and generate response codes.
- Split API into separate files.
- Tag protected apps.
- Wrap `getCookieSession` into `getSession` for support of more methods.

- NGINX: Default template supports audited apps.
- NGINX: Increase server names hash map sizes.
- NGINX: Support WebSocket connections.

- Audit Report: update receiver schema.
- Audit Report: whitelisted events without session are not unknown.

## 0.2.10
- Support SMTP transport for audit reports.

## 0.2.9
- Nginx limis are too tight.

## 0.2.8
- Harden default nginx configuration.
- Support HSTS header configuration (disabled by default).

## 0.2.7
- Forgot version bump.

## 0.2.6
- Add Audit Tool command line options.
- Add Audit Tool external configuration.

## 0.2.5
- Add missing `prom-client` dependency.
- Encode hashed IDs with base64 (not hex).
- Support `version` command and `--version` flag.

## 0.2.4
- AuthGateway logo.
- Acmetool integration.
- Reload Auth and HTTP proxy (for certs update and logrotate).

## 0.2.3
- Expose metrics.

## 0.2.2
- Audit report builder.
- Update package version.

## 0.2.1
- Docker-based demo (with docker compose).
- Simple HTTP Push recevier.

## 0.2.0
- Convert callbacks to promises (breaking).
- HTTP POST auditor.
- Remove old portal prototype.

## 0.1.7
- Add session ID to /api/proxied/session.
- Auditor subsystem.
- Build request context.
- Render user profile information.

## 0.1.6
- Have HTTP Proxy redirect to the protal.
- Use session information to determine /api/auth return code.

## 0.1.5
- Detect path being authenticated.
- HTTP Proxy (nginx) checks /api/auth for proxied requests.
- Started /api/auth to always allow.

## 0.1.4
- Added empty profile page.
- Show message that no apps are available.
- Show user dropdown in navbar.

## 0.1.3
- Pass user session to index template.
- User session endpoint.

## 0.1.2
- Generate Auth proxy configuration (oauth2).
- Implement login flow.
- Self signed HTTPS for tests.
- Start Auth proxy to authenticate requests.
- TLS termination at HTTP proxy.

## 0.1.1
- Core backend API server.
- Have the proxy serve WebUI statics.
- Web portal nav and home page.

## [0.1.0]
### Added
- Generate HTTP(S) proxy configuration (nginx).
- Yaml based configuration file (to override defaults).
- Start HTTP(S) proxy to serve apps and portal.

## 0.0.0
### Added
- Prototype web UI.

[Unreleased]: https://github.com/stefano-pogliani/auth-gateway/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/stefano-pogliani/auth-gateway/compare/v0.4.6...v0.5.0
[0.4.6]: https://github.com/stefano-pogliani/auth-gateway/compare/v0.4.5...v0.4.6
[0.4.5]: https://github.com/stefano-pogliani/auth-gateway/compare/v0.4.4...v0.4.5
[0.4.4]: https://github.com/stefano-pogliani/auth-gateway/compare/v0.4.3...v0.4.4
[0.4.3]: https://github.com/stefano-pogliani/auth-gateway/compare/v0.4.3...v0.4.4
[0.4.3]: https://github.com/stefano-pogliani/auth-gateway/compare/v0.4.2...v0.4.3
[0.1.0]: https://github.com/stefano-pogliani/auth-gateway/compare/v0.0.0...v0.1.0
