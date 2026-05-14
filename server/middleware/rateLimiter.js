import rateLimit from 'express-rate-limit';

export const aiLimiter = rateLimit({
  windowMs: 3600000, // 1 hour
  max: 20,
  keyGenerator: (req) => {
    if (req.user?.id) return `user:${req.user.id}`;
    const ip = req.ip || '';
    return ip.replace(/^::ffff:/, '');
  },
  validate: { trustProxy: false, xForwardedForHeader: false, keyGeneratorIpFallback: false },
  message: { error: 'Too many AI requests, please wait before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});
