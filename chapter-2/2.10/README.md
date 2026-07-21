# Exercise 2.10 – The project, step 13

## Description

Added structured logging to the Todo Backend and enforced the 140-character todo limit in the backend.

## Implementation

- Logs every todo submitted to `POST /todos`.
- Logs successfully created todos.
- Logs rejected todos and their rejection reason.
- Rejects empty todos.
- Rejects todos longer than 140 characters.
- Uses `MAX_TODO_LENGTH` as runtime configuration.
- Sends backend logs to Loki through Alloy.
- Verified project logs in Grafana.

## Monitoring

The monitoring stack includes:

- Prometheus
- Loki
- Alloy
- Grafana

Logs from the `project` namespace can be queried in Grafana using:

```logql
{namespace="project"}

rejected todos can be queried using:
{namespace="project"} |= "todo_rejected"
