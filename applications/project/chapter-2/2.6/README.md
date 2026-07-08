# Exercise 2.6 – The project, step 10

## Description

Removed hardcoded configuration values from the Todo application.

The application now receives its configuration through a ConfigMap using environment variables.

### Environment variables

- PORT
- IMAGE_URL
- TODO_BACKEND_URL

The deployment loads these values using `envFrom` and a ConfigMap.
