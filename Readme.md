AuthGateway
===========
A fully featured auth gateway for web applications.


What is AuthGateway?
--------------------
AuthGateway is an HTTP(S) proxy that adds user authentication and verification
to all requests received before they are sent to other HTTP(S) applications.

The core aims are simple, AuthGateway provides:

  * A proxy to ensure web requests are authenticated.
  * A login portal with multiple providers (like GitHub, Google, ...).
  * Session auditing.
  * An interface to login/logout, view the session history,
    and list the protected apps.

There are more ambitious goals too that may be implemented ONLY AFTER
the core functionality is implemented and stable.


Architecture
------------
Below is a diagram of how the various processes interact.

```text
    +----------------+
    | User's browser |
    +----------------+
            |
          HTTPS
            |
            V
     +-------------+        +---------------------------+
     | Nginx proxy | --+--> | Web Portal (static files) |
     +-------------+   |    +---------------------------+
            |          |      +-------------+ --------\
         HTTP(S)       +----> | OAuth2Proxy |         |
            |          |      +-------------+ <--\    |
    +-------V--------+ |                         |    V
   +----------------+| |                +---------------------+
   | Protected apps |+ \--------------> | AuthGateway backend |
   +----------------+                   +---------------------+
```

  1. Nginx provides the following:
      * Proxy requests to protected apps.
      * Verify sessions with `auth_request` to the backend.
      * Serve static files for the portal.
      * Proxy requests to `oauth2_proxy` and to the gateway backend.

  2. OAuth2 Proxy provides the following:
      * Configurable provider sign oauth flow (sign in).
      * Session validation and cookie.
      * Provide user information through `--pass-*` flags.

  3. AuthGateway backend provides the following:
      * JSON export of user information (thanks to `--pass-*` flags).
      * Provide a list of apps to the portal Web UI.
      * Generate nginx and oauth2_proxy configuration files.


Requirements
------------
AuthGateway is built on top of the following software:

  * Nginx
  * Oauth2
