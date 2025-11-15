/**
 * Normalize IP address
 * Converts IPv6 localhost to IPv4 and handles IPv6-mapped IPv4 addresses
 */
const normalizeIp = (ip) => {
  if (!ip || ip === "unknown") {
    return "unknown";
  }

  // Remove brackets from IPv6 addresses
  ip = ip.replace(/^\[|\]$/g, "");

  // Convert IPv6 localhost to IPv4 localhost
  if (ip === "::1" || ip === "::ffff:127.0.0.1") {
    return "127.0.0.1";
  }

  // Extract IPv4 from IPv6-mapped IPv4 addresses (::ffff:192.168.1.1)
  if (ip.startsWith("::ffff:")) {
    return ip.substring(7);
  }

  return ip;
};

/**
 * Extract client IP address from request
 * Handles proxies and load balancers
 */
const getClientIp = (req) => {
  // Check various headers for IP (in order of preference)
  const forwarded = req.headers["x-forwarded-for"];
  const realIp = req.headers["x-real-ip"];
  const cfConnectingIp = req.headers["cf-connecting-ip"]; // Cloudflare

  let ip = null;

  if (forwarded) {
    // X-Forwarded-For can contain multiple IPs, get the first one (client IP)
    ip = forwarded.split(",")[0].trim();
  } else if (realIp) {
    ip = realIp;
  } else if (cfConnectingIp) {
    ip = cfConnectingIp;
  } else {
    // Fallback to connection remote address
    // Express req.ip is available when trust proxy is enabled
    ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress;
  }

  // Normalize and return the IP
  return normalizeIp(ip || "unknown");
};

/**
 * Extract device information from request
 */
const getDeviceInfo = (req) => {
  const userAgent = req.headers["user-agent"] || "";
  
  // Basic device detection
  const deviceInfo = {
    userAgent: userAgent,
    platform: "unknown",
    browser: "unknown",
  };

  // Simple platform detection
  if (userAgent.includes("Mobile")) {
    deviceInfo.platform = "mobile";
  } else if (userAgent.includes("Tablet")) {
    deviceInfo.platform = "tablet";
  } else {
    deviceInfo.platform = "desktop";
  }

  // Simple browser detection
  if (userAgent.includes("Chrome")) deviceInfo.browser = "Chrome";
  else if (userAgent.includes("Firefox")) deviceInfo.browser = "Firefox";
  else if (userAgent.includes("Safari")) deviceInfo.browser = "Safari";
  else if (userAgent.includes("Edge")) deviceInfo.browser = "Edge";

  return deviceInfo;
};

module.exports = {
  getClientIp,
  getDeviceInfo,
};


