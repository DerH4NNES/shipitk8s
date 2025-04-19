# 🚀 shipitk8s

A lightweight tool for quickly deploying preconfigured services into your Kubernetes cluster via a simple Next.js UI and Kustomize.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Prerequisites](#prerequisites)
3. [Installation & Startup](#installation--startup)
4. [Base Deployments Structure](#base-deployments-structure)
5. [Generating an Overlay](#generating-an-overlay)
6. [Available Services](#available-services)
7. [Local Testing with Minikube](#local-testing-with-minikube)
8. [Deploying an Overlay](#deploying-an-overlay)
9. [Frontend Overview](#frontend-overview)
10. [Adding a New Base Deployment](#adding-a-new-base-deployment)
11. [Projects Workflow](#projects-workflow)

---

## Project Overview

`shipitk8s` lets you select from prepared **base deployments** (e.g. MariaDB, Nextcloud, Keycloak, Rocket.Chat, Minecraft, etc.), fill in configuration values, generate a Kustomize overlay and deploy it to your cluster—all with a single click.

---

## Prerequisites

- Node.js ≥ 22 & npm
- Docker (for Minikube or local cluster)
- `kubectl` CLI
- `kustomize` CLI
- Linux or macOS (Windows tweaks are possible)

---

## Installation & Startup

Before starting the app, you need a running Keycloak instance and a configured client:

1. **Start Keycloak**
   - Spin up a Keycloak server (e.g. via Docker Compose or your cluster).
   - Make sure it’s accessible at `http://localhost:8080` (or adjust URLs below).

2. **Configure Keycloak**
   - Log in to the Admin Console at `http://localhost:8080` with your admin credentials.
   - Create a new Realm (e.g. `demo`).
   - Under **Clients**, add a client with:
      - **Client ID**: `nextjs-app`
      - **Root URL**: `http://localhost:3000`
      - **Valid Redirect URIs**: `http://localhost:3000/*`
   - Copy the **Client Secret** from the client’s **Credentials** tab.

3. **Environment Variables**  
   Create a file named `.env.local` in your project root with the following entries (replace placeholders):
   ```env
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=<your-random-32-byte-secret>
   KEYCLOAK_ISSUER=http://localhost:8080/realms/demo
   KEYCLOAK_CLIENT_ID=nextjs-app
   KEYCLOAK_CLIENT_SECRET=<the-client-secret-you-copied>


4. **Run ShipIt**
```bash
git clone https://github.com/DerH4NNES/shipitk8s.git
cd shipitk8s
npm install
npm run dev
```

The UI will be available at `http://localhost:3000`.

---

## Base Deployments Structure

Under `base-deployments/` you define one folder per service:

```
base-deployments/
├── mariadb/
│   ├── mariadb.yaml
│   └── k8s-deployment/
│       ├── kustomization.yaml
│       ├── deployment.yaml
│       ├── service.yaml
│       ├── pvc.yaml
│       └── patch-templates/
│           ├── deployment-patch.yaml
│           ├── storage.yaml
│           └── ingress-patch.yaml
├── nextcloud/
│   └── … (similar)
├── keycloak/
│   └── …
└── postgres/
    └── …
```

- **`<service>.yaml`**: metadata and variable definitions
- **`k8s-deployment/`**: base resources (Deployment/StatefulSet, Service, PVC, Ingress)
- **`patch-templates/`**: Kustomize strategic-merge patches for env vars, replicas, storage, ingress host

---

## Generating an Overlay

1. Click **“Deploy Service”** in the UI
2. Select a service
3. Fill in the variables in the modal
4. Click **“Generate”**
5. The API creates `generated-overlays/<service>-<timestamp>/`
6. Inside you’ll find:
   - `namespace.yaml`
   - `secret.yaml` (if a database secret is needed)
   - rendered patch templates
   - `kustomization.yaml`
   - `all.yaml` (output of `kustomize build`)

---

## Available Services

- **mariadb** – MariaDB with PVC & Secret
- **nextcloud** – Nextcloud file sharing + Ingress
- **keycloak** – Keycloak IDAM with embedded PostgreSQL folder
- **rocket.chat** – Rocket.Chat with MongoDB
- **minecraft** – Vanilla Minecraft server (NodePort)
- …and more popular OSS stacks

---

## Local Testing with Minikube

```bash
# 1. Start Minikube with Docker driver and enable addons
minikube start --driver=docker
minikube addons enable ingress
minikube addons enable dashboard

# 2. Add host entries to /etc/hosts:
#    $(minikube ip) nextcloud.local keycloak.local chat.local minecraft.local

# 3. Start the Next.js dev server
npm run dev

# 4. In the UI, generate an overlay and deploy it
```

Open the Kubernetes Dashboard:

```bash
minikube dashboard
```

---

## Deploying an Overlay

Either use the **Deploy** button in the UI or run:

```bash
kubectl apply -k generated-overlays/<service>-<timestamp>
```

Verify:

```bash
kubectl get all -n <namespace>
kubectl get pvc,ingress -n <namespace>
```

---

## Frontend Overview

- **Card layout** showing service name, relative timestamp (hover for exact date)
- **Badges** for namespace, PVCs, ingress hosts, CPU/RAM limits
- **Buttons**: Details & Deploy

---

## Adding a New Base Deployment

1. Create `base-deployments/<service>/`
2. Add `<service>.yaml` with metadata and variables
3. Create `k8s-deployment/`:
   - Deployment or StatefulSet, Service, PVC, Ingress
4. Create `patch-templates/`:
   - Patches for env vars, replicas, storage size, ingress host
5. Test in the UI by generating and deploying the overlay

---

*This README covers all key steps—from defining base deployments to local testing and deployment.*  

## Projects Workflow

With the new Projects feature, you can group one or more services (tools) into logical **Projects**, each representing its own Kubernetes namespace.

1. **Projects Overview** (`/projects`)
   - Lists all existing projects (folders under `generated-overlays/`).
   - Click **“View Project”** to see its deployed tools.
   - **Create Project** opens a modal to enter a slug (lowercase + hyphens) and display name.

2. **Project Detail** (`/projects/[project]`)
   - Shows all tools currently deployed in this project.
   - **Add Tool** button opens a modal:
      - Select from available services (pulled via `/api/services`).
      - Fill in the service’s configuration variables.
      - Click **Deploy** to generate and apply the overlay.
   - Each tool card links to its **Overlay Detail**.

3. **Overlay Detail** (`/projects/[project]/overlays/[overlay]`)
   - Comprehensive view of one overlay:
      - **Deployments**, **Services**, **PVCs**, **Ingress** sections.
      - Summed CPU & RAM limits.
      - Raw `all.yaml` in an accordion.
      - **Back to Project** button.

4. **API Endpoints**
   - `GET /api/projects`
   - `POST /api/projects`
   - `GET /api/projects/[project]/tools`
   - `POST /api/projects/[project]/tools/[tool]`
   - `GET /api/services`
   - `GET /api/services/[service]`
   - `POST /api/generate/[service]`

This workflow ensures that each project maps to its own namespace and folder under `generated-overlays/<project>/`, keeping your deployments organized and isolated.  
