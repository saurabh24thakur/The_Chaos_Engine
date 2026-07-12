// utils/createProxy.js

export const createServiceProxy = (target) => {
    return createProxyMiddleware({
        target,
        changeOrigin: true,
    });
};