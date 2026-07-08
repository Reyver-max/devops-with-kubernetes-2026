# Exercise 2.5 - Documentation and ConfigMaps

## Objective

Use a ConfigMap to provide both:

- an environment variable (`MESSAGE`)
- a file (`information.txt`)

to the Log Output application.

## Result

The application now:

- Reads `MESSAGE` from a ConfigMap as an environment variable.
- Reads `information.txt` through a mounted ConfigMap volume.
- Prints both values together with the normal application output.
