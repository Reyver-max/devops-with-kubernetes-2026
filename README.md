# DevOps with Kubernetes 2026

Repository for the University of Helsinki DevOps with Kubernetes course.

## Chapter 1 Status

Completed exercises:

* 1.1 Getting Started
* 1.2 The Project, Step 1
* 1.3 Declarative Approach
* 1.4 The Project, Step 2

## Applications

### Log Output

Location:

applications/log-output

Features:

* Generates a random string on startup
* Outputs timestamp and string every 5 seconds
* Deployed to Kubernetes using a Deployment manifest

### Todo App

Location:

applications/project

Features:

* Node.js web server
* Configurable through PORT environment variable
* Returns a simple response
* Deployed to Kubernetes using a Deployment manifest

## Kubernetes Setup

Cluster:

* k3d cluster: another-cluster

Tools:

* Docker Desktop
* k3d
* kubectl

## Repository Structure

applications/

* log-output/
* project/

chapter-1/

* 1.1/
* 1.2/
* 1.3/
* 1.4/

## Releases

* 1.1
* 1.2
* 1.3
* 1.4

