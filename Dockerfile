# -------------------------------------------------------------------------------------------------
# AuthGateway distroless container image.
# Built with: ./build-image.sh <VERSION: 0.5.0>
# -------------------------------------------------------------------------------------------------

# Build AuthGateway in a clean environment.
FROM docker.io/library/rust:1.57.0 as build-env
WORKDIR /code
COPY . /code
RUN cargo build --release

# Make sure the resulting build works.
RUN /code/target/release/authgateway --version

# Package the built binary in the smallest possible image.
FROM gcr.io/distroless/cc
COPY --from=build-env /code/target/release/authgateway /
ENTRYPOINT ["./authgateway"]
