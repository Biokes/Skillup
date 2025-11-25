import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const BASE_URL = 'http://localhost:8080/api'

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 500;
export const PADDLE_WIDTH = 5;
export const BALL_RADIUS = 8; 
export const PADDLE_MOVEMENT = 20;
export const TIMEOUT_DURATION = 15000;
export const TOKEN_DECIMALS = 10_000_000_000
export const VAULT_OBJECT_ID = ''
export const CONTRACT_TARGET = ''