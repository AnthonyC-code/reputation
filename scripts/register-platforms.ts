/**
 * register-platforms.ts
 *
 * Registers the 3 deterministic mock platforms that DemoPanel.tsx uses.
 * Run this once on devnet after deploying so the demo page works end-to-end.
 *
 * Cost: ~0.32 SOL total (0.1 SOL stake + rent per platform × 3)
 *
 * Usage:
 *   ANCHOR_PROVIDER_URL=https://api.devnet.solana.com \
 *   ANCHOR_WALLET=~/.config/solana/id.json \
 *   npx ts-node scripts/register-platforms.ts
 */

import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, Connection } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

const PROGRAM_ID_FILE = path.join(__dirname, "../shared/program_id.txt");
const CONSTANTS_FILE  = path.join(__dirname, "../shared/constants.json");

const programIdStr = fs.existsSync(PROGRAM_ID_FILE)
  ? fs.readFileSync(PROGRAM_ID_FILE, "utf-8").trim()
  : "3NQPuNCmLvouhRYJD4LxEFNqg42ooTzh272m4f2BVgkb";

const PROGRAM_ID = new PublicKey(programIdStr);

// Must match DemoPanel.tsx seedBuf() logic exactly
function seedBuf(label: string): Uint8Array {
  const buf = Buffer.alloc(32, 0);
  Buffer.from(label).copy(buf, 0, 0, 32);
  return buf;
}

const PLATFORM_KEYPAIRS: Array<{ name: string; keypair: Keypair }> = [
  { name: "Soleer Mock",    keypair: Keypair.fromSeed(seedBuf("soleer-mock-platform-seed"))    },
  { name: "Gibwork Mock",   keypair: Keypair.fromSeed(seedBuf("gibwork-mock-platform-seed"))   },
  { name: "Superteam Mock", keypair: Keypair.fromSeed(seedBuf("superteam-mock-platform-seed")) },
];

function platformPda(authority: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("platform"), authority.toBuffer()],
    PROGRAM_ID
  );
}

function vaultPda(authority: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), authority.toBuffer()],
    PROGRAM_ID
  );
}

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const program = anchor.workspace.ReputationPassport as any;
  const connection = provider.connection;
  const payer = (provider.wallet as anchor.Wallet).payer;

  console.log(`Program:  ${PROGRAM_ID.toBase58()}`);
  console.log(`Payer:    ${payer.publicKey.toBase58()}`);

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

  async function fundFromPayer(dest: PublicKey, lamports: number) {
    const tx = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: dest,
        lamports,
      })
    );
    tx.recentBlockhash = blockhash;
    tx.feePayer = payer.publicKey;
    tx.sign(payer);
    const sig = await connection.sendRawTransaction(tx.serialize());
    await connection.confirmTransaction(
      { signature: sig, blockhash, lastValidBlockHeight },
      "confirmed"
    );
  }

  for (const { name, keypair } of PLATFORM_KEYPAIRS) {
    const [platKey]  = platformPda(keypair.publicKey);
    const [vaultKey] = vaultPda(keypair.publicKey);

    // Check if already registered
    const existing = await connection.getAccountInfo(platKey);
    if (existing) {
      console.log(`  ⏭  ${name} already registered (${platKey.toBase58()})`);
      continue;
    }

    // Fund platform: 0.1 SOL stake + rent buffer
    console.log(`  Funding ${name}...`);
    await fundFromPayer(keypair.publicKey, 120_000_000); // 0.12 SOL

    console.log(`  Registering ${name}...`);
    await program.methods
      .registerPlatform(name, new anchor.BN(100_000_000))
      .accounts({
        platform:          platKey,
        platformAuthority: keypair.publicKey,
        vault:             vaultKey,
        payer:             keypair.publicKey,
        systemProgram:     SystemProgram.programId,
      })
      .signers([keypair])
      .rpc();

    console.log(`  ✓ ${name} — PDA: ${platKey.toBase58()}`);
  }

  console.log("\nDone! Platforms are ready for DemoPanel.");
  console.log("Platform pubkeys (DemoPanel uses these as platformSigner):");
  for (const { name, keypair } of PLATFORM_KEYPAIRS) {
    const [platKey] = platformPda(keypair.publicKey);
    console.log(`  ${name}: signer=${keypair.publicKey.toBase58()} pda=${platKey.toBase58()}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
