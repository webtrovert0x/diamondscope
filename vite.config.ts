import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'serve-reown-config',
        configureServer(server) {
          server.middlewares.use('/api/config', (req, res) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                reownId: env.REOWN_ID || '',
                chainId: env.CHAIN_ID || '968',
                rpcUrl: env.RPC_URL || 'https://rpc.bohr.life',
                explorerUrl: env.EXPLORER_URL || 'https://scan.bohr.life/',
                contractAddress: env.DIAMONDSCOPE_CONTRACT_ADDRESS || '',
              })
            );
          });
        },
      },
    ],
    define: {
      'process.env.REOWN_ID': JSON.stringify(env.REOWN_ID || ''),
      'process.env.RPC_URL': JSON.stringify(env.RPC_URL || 'https://rpc.bohr.life'),
      'process.env.CHAIN_ID': JSON.stringify(env.CHAIN_ID || '968'),
      'process.env.EXPLORER_URL': JSON.stringify(env.EXPLORER_URL || 'https://scan.bohr.life/'),
      'process.env.DIAMONDSCOPE_CONTRACT_ADDRESS': JSON.stringify(env.DIAMONDSCOPE_CONTRACT_ADDRESS || ''),
    },
    server: {
      port: 5173,
    },
  };
});

