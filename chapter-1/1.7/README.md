# Exercise 1.7

Application source code:

```text
../../applications/log-output
```

Deployment manifest:

```text
../../applications/log-output/manifests/deployment.yaml
```

Service manifest:

```text
../../applications/log-output/manifests/service.yaml
```

Ingress manifest:

```text
../../applications/log-output/manifests/ingress.yaml
```

Description:

The Log Output application was modified to expose an HTTP endpoint that returns:

* The current timestamp
* A random string generated on startup

The application was exposed through:

1. A ClusterIP Service
2. An Ingress resource

Verified in Kubernetes with:

```bash
kubectl get pods
kubectl get svc
kubectl get ingress
```

Accessed through:

```text
http://localhost:8081/log-output
```

Example output:

```text
2026-06-22T12:34:56.789Z: 3f7b8d7c-6e4c-4e2a-b2f0-123456789abc
```

