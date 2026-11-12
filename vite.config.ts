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
                chainId: env.CHAIN_ID || '677',
                rpcUrl: env.RPC_URL || 'https://rpc.botchain.ai',
                explorerUrl: env.EXPLORER_URL || 'https://scan.botchain.ai/',
                contractAddress: env.DIAMONDSCOPE_CONTRACT_ADDRESS || '0x63fE2E161E2f00bFf5C1Df8Ff78807A7a7E0E380',
              })
            );
          });
        },
      },
    ],
    define: {
      'process.env.REOWN_ID': JSON.stringify(env.REOWN_ID || ''),
      'process.env.RPC_URL': JSON.stringify(env.RPC_URL || 'https://rpc.botchain.ai'),
      'process.env.CHAIN_ID': JSON.stringify(env.CHAIN_ID || '677'),
      'process.env.EXPLORER_URL': JSON.stringify(env.EXPLORER_URL || 'https://scan.botchain.ai/'),
      'process.env.DIAMONDSCOPE_CONTRACT_ADDRESS': JSON.stringify(env.DIAMONDSCOPE_CONTRACT_ADDRESS || '0x63fE2E161E2f00bFf5C1Df8Ff78807A7a7E0E380'),
    },
    server: {
      port: 5173,
    },
  };
});
