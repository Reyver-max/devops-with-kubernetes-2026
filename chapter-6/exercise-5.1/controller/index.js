const k8s = require('@kubernetes/client-node');

const kc = new k8s.KubeConfig();

if (process.env.KUBERNETES_SERVICE_HOST) {
  kc.loadFromCluster();
} else {
  kc.loadFromDefault();
}

const watch = new k8s.Watch(kc);

// Kubernetes API clients
const coreApi = kc.makeApiClient(k8s.CoreV1Api);
const appsApi = kc.makeApiClient(k8s.AppsV1Api);

console.log('DummySite controller started');
console.log('Watching for DummySite resources...');

async function createHtmlConfigMap(name, namespace, html) {
  const configMapName = `${name}-html`;

  const configMap = {
    metadata: {
      name: configMapName,
      namespace: namespace,
    },
    data: {
      'index.html': html,
    },
  };

  try {
    await coreApi.createNamespacedConfigMap({
      namespace: namespace,
      body: configMap,
    });

    console.log(`ConfigMap created: ${configMapName}`);
  } catch (err) {
    if (err.code === 409 || err.statusCode === 409) {
      console.log(`ConfigMap ${configMapName} already exists.`);
    } else {
      throw err;
    }
  }
}

async function createDeployment(name, namespace) {
  const deployment = {
    metadata: {
      name: name,
      namespace: namespace,
    },

    spec: {
      replicas: 1,

      selector: {
        matchLabels: {
          app: name,
        },
      },

      template: {
        metadata: {
          labels: {
            app: name,
          },
        },

        spec: {
          containers: [
            {
              name: 'nginx',
              image: 'nginx:alpine',

              ports: [
                {
                  containerPort: 80,
                },
              ],

              volumeMounts: [
                {
                  name: 'html',
                  mountPath: '/usr/share/nginx/html',
                },
              ],
            },
          ],

          volumes: [
            {
              name: 'html',
              configMap: {
                name: `${name}-html`,
              },
            },
          ],
        },
      },
    },
  };

  try {
    await appsApi.createNamespacedDeployment({
      namespace: namespace,
      body: deployment,
    });

    console.log(`Deployment created: ${name}`);
  } catch (err) {
    if (err.code === 409 || err.statusCode === 409) {
      console.log(`Deployment ${name} already exists.`);
    } else {
      throw err;
    }
  }
}

async function createService(name, namespace) {
  const serviceName = `${name}-svc`;

  const service = {
    metadata: {
      name: serviceName,
      namespace: namespace,
    },

    spec: {
      selector: {
        app: name,
      },

      ports: [
        {
          protocol: 'TCP',
          port: 80,
          targetPort: 80,
        },
      ],
    },
  };

  try {
    await coreApi.createNamespacedService({
      namespace: namespace,
      body: service,
    });

    console.log(`Service created: ${serviceName}`);
  } catch (err) {
    if (err.code === 409 || err.statusCode === 409) {
      console.log(`Service ${serviceName} already exists.`);
    } else {
      throw err;
    }
  }
}

async function handleDummySite(dummySite) {
  const name = dummySite.metadata.name;
  const namespace = dummySite.metadata.namespace || 'default';
  const websiteUrl = dummySite.spec.website_url;

  console.log(`New DummySite detected: ${name}`);
  console.log(`Namespace: ${namespace}`);
  console.log(`Website: ${websiteUrl}`);

  try {
    console.log(`Downloading ${websiteUrl}...`);

    const response = await fetch(websiteUrl);

    if (!response.ok) {
      throw new Error(
        `Website returned HTTP ${response.status} ${response.statusText}`
      );
    }

    const html = await response.text();

    console.log('Website downloaded successfully.');
    console.log(`Downloaded ${html.length} characters.`);

    await createHtmlConfigMap(name, namespace, html);
    await createDeployment(name, namespace);
    await createService(name, namespace);

  } catch (err) {
    console.error(`Failed to process DummySite ${name}:`, err);
  }
}

async function watchDummySites() {
  while (true) {
    console.log('Watching for DummySite resources...');

    try {
      await watch.watch(
        '/apis/stable.dwk/v1/dummysites',
        {},
        (type, obj) => {
          console.log(`DummySite event: ${type}`);

          if (type === 'ADDED') {
            handleDummySite(obj);
          }
        },
        (err) => {
          if (err) {
            console.log(`Watch connection ended: ${err.name || 'unknown error'}`);
          }
        }
      );
    } catch (err) {
      console.log(`Watch failed: ${err.message}`);
    }

    console.log('Restarting watch in 2 seconds...');

    await new Promise((resolve) => {
      setTimeout(resolve, 2000);
    });
  }
}

watchDummySites();
