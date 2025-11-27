import { Game } from "../data/models/Game";
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Secp256k1Keypair } from '@mysten/sui/keypairs/secp256k1';
import { Secp256r1Keypair } from '@mysten/sui/keypairs/secp256r1';
import { decodeSuiPrivateKey, ParsedKeypair } from '@mysten/sui/cryptography';
import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { ChainSkillsException } from "../exceptions";

export class PaymentService {
    private readonly keypair: Ed25519Keypair | Secp256k1Keypair | Secp256r1Keypair;
    private readonly suiClient: SuiClient;
    private static VAULT_PACKAGE_ID: string = '0xef7dbd1a7f268aa8eceec235c5d5d423049b667f1981902a405e313b013ffa92';
    private static VAULT_OBJECT_ID: string = '0xf9cf9321c73e912a44fcd4ca60cd1d3a2aa6bb4358e863ed60666cab17faf64c';
    constructor() {
        const decoded: ParsedKeypair = decodeSuiPrivateKey(process.env.SIGNING_WALLET_PRIVATE_KEY!);
        let keypair: Ed25519Keypair | Secp256k1Keypair | Secp256r1Keypair | '' = '';
        if (decoded.scheme === 'ED25519') keypair = Ed25519Keypair.fromSecretKey(decoded.secretKey);
        else if (decoded.scheme === 'Secp256k1') keypair = Secp256k1Keypair.fromSecretKey(decoded.secretKey);
        else if (decoded.scheme === 'Secp256r1') keypair = Secp256r1Keypair.fromSecretKey(decoded.secretKey);
        this.keypair = keypair as Ed25519Keypair | Secp256k1Keypair | Secp256r1Keypair;
        this.suiClient = new SuiClient({url: 'https://rpc-testnet.onelabs.cc'});
    }

    async settleWinner(winnerAddress: string, game: Game) {
        const tx: Transaction = new Transaction();
        tx.moveCall({
            target: `${PaymentService.VAULT_PACKAGE_ID}::vault::endGame`,
            arguments: [
                tx.object(PaymentService.VAULT_OBJECT_ID),
                tx.object(game.session!.gameObjectId!),
                tx.pure.address(winnerAddress),
            ]
        })
        const result = await this.suiClient.signAndExecuteTransaction({
            transaction: tx,
            signer: this.keypair
        })
        if (result.effects?.status.error) {
            throw new ChainSkillsException(`error settling winner: ${result.effects?.status.error}`)
        }
        return result.digest;
    }

}