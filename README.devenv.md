# Development Environment
You can set up a minikube based development environment.
In this environment you can develop and iterate to your heart's content!!! :-D

```bash
# Terminal 1 - Start minikube.
minikube start --driver virtualbox
minikube mount "${PWD}:/auth-gateway"

# Terminal 2 - Start devenv pod and interact with it.
minikube kubectl -- create secret generic auth-gateway-oauth2-client \
  --from-literal=client_id=GH_CLIENT_ID \
  --from-literal=client_secret=GH_CLIENT_SECRET
minikube kubectl -- apply -f devenv/pod.yaml
minikube kubectl -- get pods
minikube kubectl -- logs -f auth-gateway-devenv nginx

# Access the service over host-ports.
echo "$(minikube ip) auth.gateway.test service.gateway.test" | sudo tee -a /etc/hosts
curl "http://service.gateway.test:8080/"

# Run the proxy app or enter the app container
minikube kubectl -- exec -it auth-gateway-devenv app -- cargo run
minikube kubectl -- exec -it auth-gateway-devenv app -- bash

# Delete the pod (needed to force restart && apply changes).
minikube kubectl -- delete pod auth-gateway-devenv
```
