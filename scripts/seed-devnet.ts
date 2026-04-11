/**
 * seed-devnet.ts
 *
 * Seeds a demo wallet on devnet with realistic WorkRecord data.
 * Run AFTER deploying to devnet and updating PROGRAM_ID + TREASURY_PUBKEY.
 *
 * Usage:
 *   ANCHOR_PROVIDER_URL=https://api.devnet.solana.com \
 *   ANCHOR_WALLET=~/.config/solana/id.json \
 *   npx ts-node scripts/seed-devnet.ts
 */

import * as anchor from "@coral-xyz/anchor";
import {
  PublicKey,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Connection,
} from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

// ── Config — update after deploy ─────────────────────────────────────────────

const PROGRAM_ID_FILE = path.join(__dirname, "../shared/program_id.txt");
const CONSTANTS_FILE  = path.join(__dirname, "../shared/constants.json");

const programIdStr  = fs.existsSync(PROGRAM_ID_FILE)
  ? fs.readFileSync(PROGRAM_ID_FILE, "utf-8").trim()
  : "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"; // placeholder

const constants     = JSON.parse(fs.readFileSync(CONSTANTS_FILE, "utf-8"));
const treasuryPubkey = new PublicKey(constants.treasury_pubkey);

const PROGRAM_ID = new PublicKey(programIdStr);

// ── Helpers ───────────────────────────────────────────────────────────────────

function passportPda(wallet: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("passport"), wallet.toBuffer()],
    PROGRAM_ID
  );
}

function workRecordPda(worker: PublicKey, recordId: Buffer) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("work_record"), worker.toBuffer(), recordId],
    PROGRAM_ID
  );
}

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

function counterPda() {
  return PublicKey.findProgramAddressSync([Buffer.from("counter")], PROGRAM_ID);
}

function makeRecordId(n: number): Buffer {
  const buf = Buffer.alloc(32);
  buf.writeUInt32LE(n, 0);
  return buf;
}

async function confirm(connection: Connection, sig: string) {
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
}

// ── Seed data ─────────────────────────────────────────────────────────────────

const SEED_RECORDS: Array<{
  category: object;
  amount:   number;   // lamports
  rating:   number;
  disputed: boolean;
}> = [
  // Amounts reduced to ~2_000_000 lamports (0.002 SOL) each so 3 platforms
  // funded at 0.15 SOL can cover all 12 records + rent without running dry
  { category: { tech: {}     }, amount: 2_000_000, rating: 5, disputed: false },
  { category: { design: {}   }, amount: 2_000_000, rating: 4, disputed: false },
  { category: { tech: {}     }, amount: 2_000_000, rating: 5, disputed: false },
  { category: { language: {} }, amount: 2_000_000, rating: 5, disputed: false },
  { category: { tech: {}     }, amount: 2_000_000, rating: 4, disputed: false },
  { category: { design: {}   }, amount: 2_000_000, rating: 3, disputed: true  },
  { category: { teaching: {} }, amount: 2_000_000, rating: 5, disputed: false },
  { category: { tech: {}     }, amount: 2_000_000, rating: 5, disputed: false },
  { category: { other: {}    }, amount: 2_000_000, rating: 4, disputed: false },
  { category: { tech: {}     }, amount: 2_000_000, rating: 5, disputed: false },
  { category: { design: {}   }, amount: 2_000_000, rating: 4, disputed: false },
  { category: { language: {} }, amount: 2_000_000, rating: 5, disputed: false },
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const program = anchor.workspace.ReputationPassport as any;
  const connection = provider.connection;
  const payer = (provider.wallet as anchor.Wallet).payer;

  console.log(`Program:   ${PROGRAM_ID.toBase58()}`);
  console.log(`Treasury:  ${treasuryPubkey.toBase58()}`);
  console.log(`Payer:     ${payer.publicKey.toBase58()}`);

  // Deterministic platform keypairs — must match DemoPanel.tsx seedBuf() exactly
  function seedBuf(label: string): Uint8Array {
    const buf = Buffer.alloc(32, 0);
    Buffer.from(label).copy(buf, 0, 0, 32);
    return buf;
  }

  const platforms: Keypair[] = [
    Keypair.fromSeed(seedBuf("soleer-mock-platform-seed")),    // Soleer Mock
    Keypair.fromSeed(seedBuf("gibwork-mock-platform-seed")),   // Gibwork Mock
    Keypair.fromSeed(seedBuf("superteam-mock-platform-seed")), // Superteam Mock
  ];
  const platformNames = ["Soleer Mock", "Gibwork Mock", "Superteam Mock"];

  // Create demo worker wallet
  const demoWorker = Keypair.generate();
  console.log(`\nDemo worker: ${demoWorker.publicKey.toBase58()}`);

  // Fund platforms and demo worker via direct transfer from payer
  // (avoids devnet airdrop rate limits; costs ~0.5 SOL total from payer)
  console.log("\nFunding accounts via payer transfer...");
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
    await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
  }

  // 0.15 SOL per platform (covers 0.1 stake + rent for accounts + tx fees)
  for (const kp of platforms) {
    await fundFromPayer(kp.publicKey, 150_000_000);
  }
  // Demo worker and treasury just need rent-exempt minimum
  await fundFromPayer(demoWorker.publicKey, 10_000_000);
  await fundFromPayer(treasuryPubkey,       10_000_000);

  // Initialize passport for demo worker
  console.log("\nInitializing passport...");
  const [passportKey] = passportPda(demoWorker.publicKey);
  const [counterKey]  = counterPda();

  await program.methods
    .initializePassport()
    .accounts({
      passport:      passportKey,
      wallet:        demoWorker.publicKey,
      payer:         payer.publicKey,
      counter:       counterKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  // Register all 3 platforms
  console.log("\nRegistering platforms...");
  for (let i = 0; i < platforms.length; i++) {
    const plat = platforms[i];
    const [platKey]  = platformPda(plat.publicKey);
    const [vaultKey] = vaultPda(plat.publicKey);

    await program.methods
      .registerPlatform(platformNames[i], new anchor.BN(100_000_000))
      .accounts({
        platform:          platKey,
        platformAuthority: plat.publicKey,
        vault:             vaultKey,
        payer:             plat.publicKey,
        systemProgram:     SystemProgram.programId,
      })
      .signers([plat])
      .rpc();

    console.log(`  ✓ ${platformNames[i]}`);
  }

  // Emit work records
  console.log("\nEmitting work records...");
  for (let i = 0; i < SEED_RECORDS.length; i++) {
    const rec      = SEED_RECORDS[i];
    const platform = platforms[i % platforms.length];
    const recordId = makeRecordId(i);
    const [platKey]   = platformPda(platform.publicKey);
    const [recordKey] = workRecordPda(demoWorker.publicKey, recordId);

    await program.methods
      .emitWorkRecord(
        [...recordId],
        rec.category,
        new anchor.BN(rec.amount),
        rec.rating,
        rec.disputed
      )
      .accounts({
        passport:       passportKey,
        workRecord:     recordKey,
        platform:       platKey,
        worker:         demoWorker.publicKey,
        treasury:       treasuryPubkey,
        platformSigner: platform.publicKey,
        systemProgram:  SystemProgram.programId,
      })
      .signers([platform])
      .rpc();

    console.log(`  ✓ Record ${i + 1}/${SEED_RECORDS.length}: ${JSON.stringify(rec.category)} rating=${rec.rating}`);
  }

  // Read final passport state
  const passport = await program.account.passportAccount.fetch(passportKey);
  console.log("\n── Final passport state ─────────────────────────────");
  console.log(`  owner:          ${passport.owner.toBase58()}`);
  console.log(`  overall_score:  ${passport.overallScore}`);
  console.log(`  total_gigs:     ${passport.totalGigs}`);
  console.log(`  dispute_count:  ${passport.disputeCount}`);
  console.log(`  total_earned:   ${passport.totalEarned.toNumber() / LAMPORTS_PER_SOL} SOL`);
  console.log(`  unique_platforms: ${passport.uniquePlatforms}`);

  // Write demo wallet address to shared/
  const demoWalletPath = path.join(__dirname, "../shared/demo_wallet.txt");
  fs.writeFileSync(demoWalletPath, demoWorker.publicKey.toBase58());
  console.log(`\n✓ Demo wallet written to shared/demo_wallet.txt`);
  console.log(`  Address: ${demoWorker.publicKey.toBase58()}`);
  console.log("\nNext: git add shared/demo_wallet.txt && git commit -m 'seed: devnet demo wallet' && git push");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
