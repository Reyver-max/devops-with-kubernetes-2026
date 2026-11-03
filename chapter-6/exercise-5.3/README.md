# Exercise 5.3 — Log App, the Service Mesh Edition

## Implementation

Extended the Log Output application with a Greeter microservice.

The Greeter is a Node.js HTTP server that responds to GET requests with a greeting configured through the `GREETING` environment variable.

Two versions are deployed:

- **Greeter v1:** `Hello from greeter v1!`
- **Greeter v2:** `Hello from greeter v2!`

Log Output requests the greeting from `greeter-svc` and includes it in its HTTP response alongside its existing status output.

## Kubernetes resources

The implementation includes:

- Two Greeter Deployments (`greeter-v1`, `greeter-v2`).
- Three Services (`greeter-svc`, `greeter-svc-1`, `greeter-svc-2`).
- An HTTPRoute attached to `greeter-svc` with weighted backend references.

## Traffic distribution

The HTTPRoute specifies:

| Backend | Weight |
|---|---|
| `greeter-svc-1` | 75% |
| `greeter-svc-2` | 25% |

This configuration is intended to distribute requests between the two Greeter versions through Istio Ambient's waypoint proxy.

## Validation

Completed:

- JavaScript syntax checks.
- YAML parsing and resource validation.
- HTTPRoute configuration validation.
- Kustomize rendering.
- Local HTTP response tests for Greeter v1 and v2.

**Limitation:** Live service-mesh traffic distribution and Kiali visualization were not verified for this exercise because the local Kubernetes cluster became unstable.

## Source code

- `applications/greeter/`
- `applications/log-output/`
