# Exercise 1.12

Application source code:

../../applications/project

Deployment manifest:

../../applications/project/manifests/deployment.yaml

Service manifest:

../../applications/project/manifests/service.yaml

Ingress manifest:

../../applications/project/manifests/ingress.yaml

Description:

The Todo App was updated to display a random image from Picsum.

The image is cached into a persistent volume so that the application does not request a new image every time the page is accessed or when the container restarts.

The cached image is refreshed after 10 minutes.

Verified with:

kubectl get pods
kubectl get svc
kubectl get ing
kubectl get pv,pvc

Accessed through:

http://localhost:8081
