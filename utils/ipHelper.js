/**
 * Extract client IP address from request
 * Handles proxies and load balancers
 */
const getClientIp = (req) => {
  // Check various headers for IP (in order of preference)
  const forwarded = req.headers["x-forwarded-for"];
  const realIp = req.headers["x-real-ip"];
  const cfConnectingIp = req.headers["cf-connecting-ip"]; // Cloudflare

  if (forwarded) {
    // X-Forwarded-For can contain multiple IPs, get the first one
    return forwarded.split(",")[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback to connection remote address
  return req.connection?.remoteAddress || req.socket?.remoteAddress || req.ip || "unknown";
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


