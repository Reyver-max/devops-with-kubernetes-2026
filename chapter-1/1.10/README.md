# Exercise 1.10

Application source code:

../../applications/log-output

Deployment manifest:

../../applications/log-output/manifests/deployment.yaml

The Log Output application was split into two containers in one Pod:

- writer container writes timestamp and random string into a shared file
- reader container reads the file and exposes it through HTTP

The containers share data using an emptyDir volume.

Verified with:

kubectl logs deployment/log-output -c log-output-writer
kubectl logs deployment/log-output -c log-output-reader

Accessed through:

http://localhost:8081/log-output
