# Exercise 1.11

Application source code:

../../applications/log-output

../../applications/ping-pong

Persistent volume manifests:

../../manifests/persistentvolume.yaml

../../manifests/persistentvolumeclaim.yaml

Log Output manifests:

../../applications/log-output/manifests

Ping-pong manifests:

../../applications/ping-pong/manifests

Description:

The Ping-pong application saves the number of requests into a file stored in a PersistentVolume.

The Log Output application reads the same file and displays the number of pings together with the timestamp and random string.

Verified with:

kubectl get pv,pvc
kubectl get pods
kubectl get svc,ing

Accessed through:

http://localhost:8081/log-output
