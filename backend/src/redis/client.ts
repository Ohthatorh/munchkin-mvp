import Redis from "ioredis";

export const redis = new Redis();

console.log("Redis client initialized");
