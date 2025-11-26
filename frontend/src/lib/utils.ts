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
export const TOKEN_DECIMALS = 1_000_000_000
// export const VAULT_OBJECT_ID = ''

export const VAULT_PACKAGE_ID='0xef7dbd1a7f268aa8eceec235c5d5d423049b667f1981902a405e313b013ffa92::vault::'
export const VAULT_OBJECT_ID='0xf9cf9321c73e912a44fcd4ca60cd1d3a2aa6bb4358e863ed60666cab17faf64c'
export const ADMIN_ADDRESS='0xa4e4f919c3797d79c7879e105db64a1c83d7e03f2fac48a77fa4a41e5d01e9da'