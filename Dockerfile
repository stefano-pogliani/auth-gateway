FROM debian:jessie-slim


# Install nginx and nodejs.
RUN apt-get update \
    && apt-get install -y curl \
    && curl -sL https://deb.nodesource.com/setup_8.x | bash - \
    && apt-get update \
    && apt-get install -y gettext nginx nodejs wget \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /authgateway/http_proxy/tmp/{client_body,fastcgi,proxy,scgi,uwsgi}


# Oauth2Proxy install.
RUN wget https://github.com/bitly/oauth2_proxy/releases/download/v2.2/oauth2_proxy-2.2.0.linux-amd64.go1.8.1.tar.gz \
    && tar --extract --file oauth2_proxy-2.2.0.linux-amd64.go1.8.1.tar.gz \
    && rm oauth2_proxy-2.2.0.linux-amd64.go1.8.1.tar.gz \
    && mv oauth2_proxy-2.2.0.linux-amd64.go1.8.1/oauth2_proxy /usr/bin/oauth2_proxy


# Add AuthGateway and install packages.
COPY . /authgateway
WORKDIR /authgateway
RUN npm install --only=prod


# Add configuration template and entry point.
COPY demo/docker/* /authgateway/
CMD ["/authgateway/entrypoint.sh"]
