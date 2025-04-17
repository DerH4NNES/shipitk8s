# ServiceDeployer

Ein einfaches Next.js-Tool, mit dem vordefinierte Services per Knopfdruck als Kustomize-Overlay erstellt und in ein Kubernetes-Cluster deployed werden können.

---

## 📂 Projektstruktur

```bash
/ (Projekt-Root)
├── app/                      # Next.js App-Router (Seiten, Layouts, API-Routen)
│   ├── api/                  # API-Routen
│   │   ├── generate/[service]/route.ts   # Overlay-Generator
│   │   ├── services/route.ts            # Liefert alle Services und Variablen
│   │   └── overlays/route.ts            # Liefert alle generierten Overlays
│   ├── overlays/page.tsx      # Übersicht generierter Overlays
│   ├── page.tsx               # Liste verfügbarer Services mit Modal
│   └── layout.tsx             # RootLayout mit Header, Footer, Navigation
├── base-deployments/         # Basis-Definitionen deiner Services
│   └── <service>/            # Beispiel: `mariadb/`
│       ├── <service>.yaml    # Metadaten und Variablen (z. B. mariadb.yaml)
│       ├── k8s-deployment/   # Basis-Kustomize-Setup (base)
│       │   ├── kustomization.yaml
│       │   ├── deployment.yaml
│       │   ├── service.yaml
│       │   └── pvc.yaml
│       └── patch-templates/  # Template-Patches mit Platzhaltern
│           ├── env.yaml      # z. B. `${rootPassword}`
│           ├── replicas.yaml
│           └── storage.yaml
├── generated-overlays/       # Hier legt das Tool neue Overlays an
├── public/                   # Statische Assets
├── README.md                 # Dieses Dokument
├── package.json
└── tsconfig.json
```

---

## 🚀 Installation und Start

1. **Voraussetzungen**

    - Node.js (>=18)
    - Yarn oder npm

2. **Dependencies installieren**

   ```bash
   yarn install
   # oder: npm install
   ```

3. **Development-Server starten**

   ```bash
   yarn dev
   # http://localhost:3000
   ```

4. **Production-Build**

   ```bash
   yarn build
   yarn start
   ```

---

## 🛠️ Workflow

1. **Services anzeigen**
    - Besuche `/` und wähle einen Service aus.
2. **Service konfigurieren**
    - Klicke auf **Bereitstellen**. Ein Modal öffnet sich mit allen konfigurierbaren Variablen.
3. **Overlay generieren & deployen**
    - Nach Bestätigung erstellt die App im Ordner `generated-overlays/<service>-<timestamp>/`
    - Enthält `kustomization.yaml`, `namespace.yaml` und alle Patch-Dateien.
4. **Übersicht**
    - Unter `/overlays` werden alle bestehenden Overlays aufgelistet und können direkt geöffnet werden.

---

## ➕ Neue Basis-Deployments anlegen

Um einen weiteren Service (z. B. Redis, PostgreSQL, Nextcloud) hinzuzufügen, folge diesen Schritten:

1. **Ordner anlegen**

   ```bash
   mkdir -p base-deployments/<service>
   ```

2. **Metadaten-Datei**

    - Erstelle `base-deployments/<service>/<service>.yaml` mit folgendem Format:

      ```yaml
      name: <service>
      description: "Kurzbeschreibung des Services"
      variables:
        - name: namespace
          type: string
          default: "default"
        - name: rootPassword
          type: string
          default: "changeme"
        - name: storageSize
          type: string
          default: "5Gi"
        - name: replicas
          type: number
          default: 1
      ```

    - `` und `` werden im Frontend angezeigt.

    - `` definiert die Felder, die im Deploy-Modal erscheinen, und legt Typ, Namen und Default-Wert fest.

3. **K8s-Basis-Setup**

    - Unter `base-deployments/<service>/k8s-deployment/` legst du alle YAML-Ressourcen als Basis an:
        - `deployment.yaml`, `service.yaml`, `pvc.yaml`, etc.
        - `kustomization.yaml` mit:
          ```yaml
          apiVersion: kustomize.config.k8s.io/v1beta1
          kind: Kustomization
          resources:
            - deployment.yaml
            - service.yaml
            - pvc.yaml
          ```

4. **Patch-Templates**

    - Lege im Ordner `base-deployments/<service>/patch-templates/` **beliebig viele** YAML-Dateien an. Jede Datei wird automatisch als Template gerendert.

    - **Platzhalter-Syntax**: Nutze `` in deinen Templates, um Werte aus der Metadaten-Datei (`<service>.yaml`) zu referenzieren. Zusätzlich steht `` für den Service-Namen.

    - **Verfügbare Variablen**: Alle Einträge aus `variables` sowie `name` werden beim Rendern übergeben. Zum Beispiel:

      ```yaml
      # env.yaml
      apiVersion: v1
      kind: Secret
      metadata:
        name: ${name}-secret        # Service-spezifischer Name
        labels:
          app: ${name}
      type: Opaque
      stringData:
        MARIADB_ROOT_PASSWORD: "${rootPassword}"  # Wert aus variables
      ```

    - **Typkonvertierung**: Der Generator behandelt alle Werte als Strings. Bei numerischen Feldern (`type: number`) liefert dein Modal eine Zahl, die automatisch interpoliert wird:

      ```yaml
      # replicas.yaml
      apiVersion: apps/v1
      kind: Deployment
      metadata:
        name: ${name}
      spec:
        replicas: ${replicas}        # z. B. 2
      ```

    - **RegEx**: Die App nutzt `lodash-es.template` mit dem Muster `/\$\{([\s\S]+?)\}/g`, um alle `${...}`-Platzhalter aufzulösen.

    - **Automatische Erkennung**: Jede `.yaml`/`.yml`-Datei in `patch-templates/` wird beim Generieren gefunden und gerendert – keine manuellen Einträge nötig.

5. **Fertig!**

    - Dein neuer Service und alle Patches erscheinen nach einem Reload von `/api/services` und `/` automatisch im Frontend.

---

## 🔒 Sicherheitshinweise

- **Secrets**: Achte darauf, dass Passwörter und sensible Daten nicht im Git-Repo verbleiben.
- **kubectl**: Wenn Du direkt aus der App deployst, stelle sicher, dass das Backend nur im internen Netzwerk erreichbar ist.

---

## 📖 Weiterführende Links

- [Next.js App Router](https://nextjs.org/docs/app)
- [Kustomize Documentation](https://kustomize.io/)
- [Bootstrap 5](https://getbootstrap.com/)

