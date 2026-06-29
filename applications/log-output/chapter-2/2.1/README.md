# Exercise 2.1 – Connecting Pods

## Objective

Replace the shared file communication between the **Log Output** and **Ping Pong** applications with HTTP communication.

## What was implemented

- Added a new `/pings` endpoint to the Ping Pong application.
- Modified the Log Output reader to fetch the ping count from `http://ping-pong-svc:2345/pings`.
- Verified communication between the two applications using a Kubernetes Service.
- The browser output now combines:
  - timestamp
  - random string
  - current ping count obtained via HTTP.
