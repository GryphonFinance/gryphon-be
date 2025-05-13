export default () => ({
    nodeEnv: process.env.NODE_ENV,
    auth: {
        jwtSecret: process.env.JWT_SECRET,
        jwtExpiration: process.env.JWT_EXPIRATION,
        signatureMessage: process.env.SIGNATURE_MESSAGE,
    },
    blockchain: {
        rpcUrl: process.env.RPC_URL,
        wsUrl: process.env.WS_URL,
        network: process.env.NETWORK,
        contractAddresses: {
            gryphon: process.env.GRYPHON_ERC20,
            bonding: process.env.BONDING,
            fRouter: process.env.FRouter,
            fFactory: process.env.FFactory,
            agentFactory: process.env.AGENT_FACTORY,
            pancakeRouter: process.env.PANCAKE_ROUTER,
            pancakeFactory: process.env.PANCAKE_FACTORY,
            busd: process.env.BUSD,
            gryphonBusdPool: process.env.GRYPHON_BUSD_POOL,
        },
    },
    database: {
        url: process.env.DATABASE_URL,
    },
    aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        bucket: process.env.AWS_BUCKET_NAME,
        region: process.env.AWS_REGION,
    },
    logger: {
        level: process.env.LOG_LEVEL || 'info',
        output: process.env.LOG_OUTPUT || 'console', // or 'file', 'json'
    },
});
