# AuthGateway
AuthGateway is a flexible authentication helper for HTTPS proxies to add user authentication and
verification to all requests received by the proxy before they are sent to upsteram HTTP(S) apps.

AuthGateway also provides some basic authorisation logic.

The aims of this project are to:

* Easily ensure HTTPS requests are authenticated.
* Easily add request auditing to your setup.
* Decuple the HTTP(S) proxy from the authentication proxy.
  * Combine any supported HTTPS proxy with any supprted authentication proxy.

## Architecture

![AuthGateway architecture diagram](./authgateway.png)

AuthGatheway is a middleware to combine an HTTP(S) proxy with an authentication proxy.

For components to integrate correctly they must support interfaces that AuthGateway can work with:

* An HTTP(S) Proxy able to delegate authentication using the [NGINX auth_request] protocol.
* A supported authentication proxy that can verify users and return some identity information.

Supported authentication proxies:
* [OAuth2 Proxy](https://oauth2-proxy.github.io/oauth2-proxy/)

Some HTTP(S) Proxies that support `auth_request`:
* [ingress-nginx](https://kubernetes.github.io/ingress-nginx/).
* [NGINX](https://www.nginx.com/).

## Configuration
TODO

### Rules
TODO

## Deploying
TODO

## Apps Catalogue
TODO

[NGINX auth_request]: https://nginx.org/en/docs/http/ngx_http_auth_request_module.html
