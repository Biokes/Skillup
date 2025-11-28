import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Secp256k1Keypair } from '@mysten/sui/keypairs/secp256k1';
import { Secp256r1Keypair } from '@mysten/sui/keypairs/secp256r1';
import { decodeSuiPrivateKey, ParsedKeypair } from '@mysten/sui/cryptography';
import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";

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
export const TOKEN_DECIMALS = 1000000000

export const VAULT_PACKAGE='0xd250f7ecd486bc561e2fd0f729810977e386185e38fa8bceacc1c1e9984bd2f7::vault::'
export const VAULT_OBJECT_ID='0x0187ee68f601601bdab52744d95eb7f88880bbcc5d574689bee568bb079441f1'
export const ADMIN_ADDRESS = '0xa4e4f919c3797d79c7879e105db64a1c83d7e03f2fac48a77fa4a41e5d01e9da'


class PaymentService {
    private readonly keypair: Ed25519Keypair | Secp256k1Keypair | Secp256r1Keypair;
  constructor() {
    const decoded: ParsedKeypair = decodeSuiPrivateKey(import.meta.env.VITE_WALLET_PRIVATE_KEY!);
    let keypair: Ed25519Keypair | Secp256k1Keypair | Secp256r1Keypair | '' = '';
    if (decoded.scheme === 'ED25519') keypair = Ed25519Keypair.fromSecretKey(decoded.secretKey);
    else if (decoded.scheme === 'Secp256k1') keypair = Secp256k1Keypair.fromSecretKey(decoded.secretKey);
    else if (decoded.scheme === 'Secp256r1') keypair = Secp256r1Keypair.fromSecretKey(decoded.secretKey);
    this.keypair = keypair as Ed25519Keypair | Secp256k1Keypair | Secp256r1Keypair;
  }
  getKeyPair() { 
    return this.keypair;
  }
}
export const paymentClient = new PaymentService();