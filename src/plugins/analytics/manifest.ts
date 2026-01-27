export default {
  id: 'analytics',
  name: 'Analytics Dashboard',
  version: '1.0.0',
  entryPoint: 'index.tsx',
  permissions: {
    canReadContext: true,
    canWriteContext: false,
    canEmitEvents: true,
    canReceiveEvents: true,
  },
  panels: [
    {
      id: 'dashboard',
      title: 'Analytics',
      icon: 'chart',
    },
  ],
};
