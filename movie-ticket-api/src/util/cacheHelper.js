import redisClient from "../config/Redis";

export const clearCacheByPattern = async (pattern) => {
  try {
    const keys = await redisClient.keys(`${pattern}*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`Cleared cache for pattern: ${pattern}* (${keys.length} keys)`);
    }
  } catch (error) {
    console.error("Error clearing cache:", error);
  }
};