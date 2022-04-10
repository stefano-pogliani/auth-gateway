# Possible Roadmap
This is a roadmap of possible features to add to AuthGateway.

As a hobby project, these may take a while to arrive and they may not arrive at all.
If you are interested in a specific feature or would like to help with one feel free to open
an issue on GitHub so we can discuss further.

1. Support rule inversion: match requests NOT matching filters.
2. Authentication header support: support application passwords and similar use cases.
3. Extra user attributes.
4. Support user roles lookup.
5. Support passing user roles upstream: app-based role access.
6. Support upstream access by role: only users with roles A, B, C can access endpoints 1, 2, 3.

## Authentication extras
* Support for OAuth2Proxy Authentication header (how does it work?).
* Support for OAuth2Proxy cookie refresh (return Set-Cookie header from oauth2_proxy).

## Authorization features
* Authorization phase to lookup groups (post authenticate; pre enrich).
  * User ID key to lookup groups (list of strings).
  * Support different lookup backends but only one at a time.
  * Filter roles in enrich phase? (use case: limit groups to app they are for).
  * Configurable concatenation method (with overrides in enrich phase).
* Static roles lookup: all users get list of groups.
* File roles lookup: YAML/JSON files indexed by user id.
* LDAP roles lookup: memberOf attribute from user-driven LDAP search.
* Authentication attributes: a space for authenticators to store extra use info (use case: saml assertions).
* Authentication attributes lookup (use case: SAML assertions to user roles).

## Other extras
* HTTP(S) POST audit backend.
* Optional AuthGateway sessions:
  * Stored in redis or something (sessions enabled only if store is configured).
  * Allow session/user server-side invalidation.
  * Support for `Authentication` header by wrapping original header value with session info.
  * Session is for ID only, authentication still verified each request with auth proxy.
