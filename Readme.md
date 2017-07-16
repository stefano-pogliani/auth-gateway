AuthGateway
===========
A fully featured auth gateway for web applications.

TODO: Description.
TODO: See QuickStart.md


Requirements
------------
AuthGateway is built on top of the following software:

  * [Caddy](https://caddyserver.com/)
  * [Hydra](https://github.com/ory/hydra)

Caddy is used to verify and proxy all web requests and serve
the static portal as well as the gateway backend.

Hydra is a server implementation of OAuth2 and OpenID Connect 1.0.
Hydra can also do advanced access control management with policy
similar to AWS IAM policies.

Please not that Hydra also requires a database server such as PostgrSQL.


The (full) auth path
--------------------
Hydra validates oauth2 tokens and performs policy decisions but does not
have a users database or a login/logout/session interface.

AuthGateway provides two components to fill in those gaps:

  * The portal: a web app designed for the end user to login and find apps.
  * The gateway: an http service that feeds data to the portal and provides
                 additional logic required on top of Hydra.

Keep in mind that AuthGateway is not an identity provider either: it does not
store user details or offer login forms/user validation.

Providers (such as Google SingleSignOn) are used to verify user identity
and return basic profile information.

What follows is the detailed explanation of the login process.
For this example we assume that AuthGateway is accessible at `https://gate/`
and you are using Google as the login provider.

  1.  The user browser visits `https://gate/portal/auth/start`.
  2.  A request is made to hydra (by the gateway) to create a new challenge.
  3.  Hydra returns a redirect to `https://gate/portal/auth/callbak/hydra/challange?challenge=...`.
  4.  The endpoint Hydra redirects to is a convenience page that converts
      the query parameter into a JSON response for the gateway to consume.
  5.  The gateway redirects the user to `https://gate/portal/login?challenge=...`.
  6.  The UI shows the user a list of login providers.
      In this example the user selects `Login with google`.
  7.  Google performs user verification and sign in.
  8.  Google redirects the user to `https://gate/portal/auth/callback/google?token=...`.
  9.  The gateway will generate a consent response and request an auth code from hydra.
  10. Hydra returns a redirect to `https://gate/portal/auth/callbak/hydra/code?code=....`.
  11. The endpoint Hydra redirects to is a convenience page that converts
      he query parameter into a JSON response for the gateway to consume.
  12. The gateway will use the client_id and the auth code to request an access token from hydra.
  13. The gateway will store the access token in a cookie.

Every request for an app that sits behind the gateway will carry the cookie
set by the login process, used by the gateway to verify the validity of the
request and the permissions of the user.
