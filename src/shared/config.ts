export type Environment = 'development' | 'qa' | 'production';

interface EnvironmentConfig {
  env: Environment;
  apiBaseUrl: string;
  vendorUrls: {
    salesforce: string;
    zendesk: string;
  };
  cbcsUrl: string;
  features: {
    enableAnalytics: boolean;
    enableDebugTools: boolean;
  };
}

const configs: Record<Environment, EnvironmentConfig> = {
  development: {
    env: 'development',
    apiBaseUrl: 'http://localhost:3000',
    vendorUrls: {
      salesforce: 'https://test.salesforce.com',
      zendesk: 'https://sandbox.zendesk.com',
    },
    cbcsUrl: 'https://test-cbcs.ventivclient.com/ivos/login.jsp',
    features: {
      enableAnalytics: true,
      enableDebugTools: true,
    },
  },
  qa: {
    env: 'qa',
    apiBaseUrl: 'https://qa-api.axis.com',
    vendorUrls: {
      salesforce: 'https://test.salesforce.com',
      zendesk: 'https://qa.zendesk.com',
    },
    cbcsUrl: 'https://test-cbcs.ventivclient.com/ivos/login.jsp',
    features: {
      enableAnalytics: true,
      enableDebugTools: true,
    },
  },
  production: {
    env: 'production',
    apiBaseUrl: 'https://api.axis.com',
    vendorUrls: {
      salesforce: 'https://login.salesforce.com',
      zendesk: 'https://yourcompany.zendesk.com',
    },
    cbcsUrl: 'https://cbcs.ventivclient.com/ivos/login.jsp',
    features: {
      enableAnalytics: true,
      enableDebugTools: false,
    },
  },
};

function getEnvironment(): Environment {
  const env = process.env.AXIS_ENV || process.env.NODE_ENV || 'development';
  return env as Environment;
}

export const config = configs[getEnvironment()];
