# Exercise 2.3 - Keep them separated

## Objective

Move the Log Output and Ping Pong applications into a dedicated Kubernetes namespace called `exercises`.

## What was done

- Created the `exercises` namespace.
- Updated all manifests to deploy into the namespace.
- Deployed Log Output and Ping Pong inside the new namespace.
- Verified communication between both applications.
- Left the project application in the default namespace as instructed.
