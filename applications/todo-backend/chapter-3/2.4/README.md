# Exercise 2.4 - The project, step 9

## Objective

Move the Todo App project into its own Kubernetes namespace.

## What was done

- Created the `project` namespace.
- Updated the Todo App Deployment, Service, and Ingress to use the new namespace.
- Moved the Todo Backend into the same namespace.
- Verified communication between Todo App and Todo Backend.
- Confirmed the application works correctly inside the new namespace.
