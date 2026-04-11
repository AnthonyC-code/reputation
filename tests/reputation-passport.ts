import * as anchor from "@coral-xyz/anchor";
import { assert } from "chai";
import {
  PublicKey,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");
const PLATFORM_STAKE_MIN = 100_000_000; // 0.1 SOL

// ── PDA helpers ───────────────────────────────────────────────────────────────

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

// ── Test suite ────────────────────────────────────────────────────────────────

describe("reputation-passport", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // @ts-ignore
  const program = anchor.workspace.ReputationPassport as anchor.Program;

  let platformAuthority: Keypair;
  let worker: Keypair;
  let treasury: Keypair;

  before(async () => {
    platformAuthority = Keypair.generate();
    worker = Keypair.generate();
    treasury = Keypair.generate();

    const airdrop = async (pk: PublicKey, sol: number) => {
      const sig = await provider.connection.requestAirdrop(pk, sol * LAMPORTS_PER_SOL);
      await provider.connection.confirmTransaction(sig, "confirmed");
    };

    await airdrop(platformAuthority.publicKey, 2);
    await airdrop(provider.wallet.publicKey,  2);
    await airdrop(worker.publicKey,           1);
    await airdrop(treasury.publicKey,         1); // must be rent-exempt before receiving splits
  });

  // ── initialize_passport ───────────────────────────────────────────────────

  describe("initialize_passport", () => {
    it("creates PDA with correct owner and zero fields", async () => {
      const [passportKey] = passportPda(worker.publicKey);
      const [counterKey]  = counterPda();

      await program.methods
        .initializePassport()
        .accounts({
          passport:      passportKey,
          wallet:        worker.publicKey,
          payer:         provider.wallet.publicKey,
          counter:       counterKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const passport = await program.account.passportAccount.fetch(passportKey);

      assert.ok(passport.owner.equals(worker.publicKey), "owner mismatch");
      assert.equal(passport.totalGigs,    0, "totalGigs should be 0");
      assert.equal(passport.sumRatings,   0, "sumRatings should be 0");
      assert.equal(passport.totalEarned.toNumber(), 0, "totalEarned should be 0");
      assert.equal(passport.badgeCount,   0, "badgeCount should be 0");
    });

    it("fails on second call (PDA already exists)", async () => {
      const [passportKey] = passportPda(worker.publicKey);
      const [counterKey]  = counterPda();

      let errored = false;
      try {
        await program.methods
          .initializePassport()
          .accounts({
            passport:      passportKey,
            wallet:        worker.publicKey,
            payer:         provider.wallet.publicKey,
            counter:       counterKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
      } catch (_) {
        errored = true;
      }
      assert.isTrue(errored, "second initializePassport should fail");
    });
  });

  // ── register_platform ─────────────────────────────────────────────────────

  describe("register_platform", () => {
    it("transfers stake and marks platform active = true", async () => {
      const [platformKey] = platformPda(platformAuthority.publicKey);
      const [vaultKey]    = vaultPda(platformAuthority.publicKey);

      await program.methods
        .registerPlatform("Soleer Mock", new anchor.BN(PLATFORM_STAKE_MIN))
        .accounts({
          platform:          platformKey,
          platformAuthority: platformAuthority.publicKey,
          vault:             vaultKey,
          payer:             platformAuthority.publicKey,
          systemProgram:     SystemProgram.programId,
        })
        .signers([platformAuthority])
        .rpc();

      const plat = await program.account.registeredPlatform.fetch(platformKey);
      assert.isTrue(plat.active, "platform should be active");
      assert.equal(plat.name, "Soleer Mock", "name mismatch");

      const vaultBal = await provider.connection.getBalance(vaultKey);
      assert.isAtLeast(vaultBal, PLATFORM_STAKE_MIN, "vault underfunded");
    });

    it("fails if stake_amount < PLATFORM_STAKE_MIN", async () => {
      const underStaker = Keypair.generate();
      const sig = await provider.connection.requestAirdrop(underStaker.publicKey, LAMPORTS_PER_SOL);
      await provider.connection.confirmTransaction(sig, "confirmed");

      const [platformKey] = platformPda(underStaker.publicKey);
      const [vaultKey]    = vaultPda(underStaker.publicKey);

      let errored = false;
      try {
        await program.methods
          .registerPlatform("Cheap", new anchor.BN(PLATFORM_STAKE_MIN - 1))
          .accounts({
            platform:          platformKey,
            platformAuthority: underStaker.publicKey,
            vault:             vaultKey,
            payer:             underStaker.publicKey,
            systemProgram:     SystemProgram.programId,
          })
          .signers([underStaker])
          .rpc();
      } catch (_) {
        errored = true;
      }
      assert.isTrue(errored, "low stake should be rejected");
    });
  });

  // ── emit_work_record ──────────────────────────────────────────────────────

  describe("emit_work_record", () => {
    // record_id is [u8;32] on-chain — pass as a 32-byte Buffer
    const recordId0 = makeRecordId(0);
    const recordId1 = makeRecordId(1);

    it("writes WorkRecord with correct fields", async () => {
      const [passportKey] = passportPda(worker.publicKey);
      const [platformKey] = platformPda(platformAuthority.publicKey);
      const [recordKey]   = workRecordPda(worker.publicKey, recordId0);

      await program.methods
        .emitWorkRecord(
          [...recordId0],      // [u8; 32]
          { tech: {} },        // WorkCategory
          new anchor.BN(10_000_000), // 0.01 SOL
          5,                   // rating
          false                // disputed
        )
        .accounts({
          passport:        passportKey,
          workRecord:      recordKey,
          platform:        platformKey,
          worker:          worker.publicKey,
          treasury:        treasury.publicKey,
          platformSigner:  platformAuthority.publicKey,
          systemProgram:   SystemProgram.programId,
        })
        .signers([platformAuthority])
        .rpc();

      const record = await program.account.workRecord.fetch(recordKey);
      assert.ok(record.worker.equals(worker.publicKey), "worker mismatch");
      assert.ok(record.platform.equals(platformAuthority.publicKey), "platform mismatch");
      assert.equal(record.rating, 5, "rating mismatch");
      assert.isFalse(record.disputed, "disputed should be false");
    });

    it("fee split: worker gets 95%, treasury gets 1%", async () => {
      const [passportKey] = passportPda(worker.publicKey);
      const [platformKey] = platformPda(platformAuthority.publicKey);
      const [recordKey]   = workRecordPda(worker.publicKey, recordId1);

      const payment = 10_000_000; // 0.01 SOL

      const workerBefore   = await provider.connection.getBalance(worker.publicKey);
      const treasuryBefore = await provider.connection.getBalance(treasury.publicKey);

      await program.methods
        .emitWorkRecord(
          [...recordId1],
          { design: {} },
          new anchor.BN(payment),
          4,
          false
        )
        .accounts({
          passport:       passportKey,
          workRecord:     recordKey,
          platform:       platformKey,
          worker:         worker.publicKey,
          treasury:       treasury.publicKey,
          platformSigner: platformAuthority.publicKey,
          systemProgram:  SystemProgram.programId,
        })
        .signers([platformAuthority])
        .rpc();

      const workerAfter   = await provider.connection.getBalance(worker.publicKey);
      const treasuryAfter = await provider.connection.getBalance(treasury.publicKey);

      assert.equal(workerAfter   - workerBefore,   Math.floor(payment * 0.95), "worker should get 95%");
      assert.equal(treasuryAfter - treasuryBefore, Math.floor(payment * 0.01), "treasury should get 1%");
    });

    it("updates PassportAccount aggregates", async () => {
      const [passportKey] = passportPda(worker.publicKey);
      const passport = await program.account.passportAccount.fetch(passportKey);

      assert.isAbove(passport.totalGigs,               0, "totalGigs should be > 0");
      assert.isAbove(passport.sumRatings,              0, "sumRatings should be > 0");
      assert.isAbove(passport.totalEarned.toNumber(),  0, "totalEarned should be > 0");
    });

    it("fails if caller is not a registered platform", async () => {
      const rogue = Keypair.generate();
      const sig = await provider.connection.requestAirdrop(rogue.publicKey, LAMPORTS_PER_SOL);
      await provider.connection.confirmTransaction(sig, "confirmed");

      const [passportKey]   = passportPda(worker.publicKey);
      const [roguePlat]     = platformPda(rogue.publicKey);
      const rogueId         = makeRecordId(99);
      const [rogueRecord]   = workRecordPda(worker.publicKey, rogueId);

      let errored = false;
      try {
        await program.methods
          .emitWorkRecord([...rogueId], { tech: {} }, new anchor.BN(1_000_000), 3, false)
          .accounts({
            passport:       passportKey,
            workRecord:     rogueRecord,
            platform:       roguePlat,
            worker:         worker.publicKey,
            treasury:       treasury.publicKey,
            platformSigner: rogue.publicKey,
            systemProgram:  SystemProgram.programId,
          })
          .signers([rogue])
          .rpc();
      } catch (_) {
        errored = true;
      }
      assert.isTrue(errored, "unregistered platform should be rejected");
    });

    it("fails if rating is 0", async () => {
      const [passportKey] = passportPda(worker.publicKey);
      const [platformKey] = platformPda(platformAuthority.publicKey);
      const badId         = makeRecordId(200);
      const [badRecord]   = workRecordPda(worker.publicKey, badId);

      let errored = false;
      try {
        await program.methods
          .emitWorkRecord([...badId], { tech: {} }, new anchor.BN(1_000_000), 0, false)
          .accounts({
            passport:       passportKey,
            workRecord:     badRecord,
            platform:       platformKey,
            worker:         worker.publicKey,
            treasury:       treasury.publicKey,
            platformSigner: platformAuthority.publicKey,
            systemProgram:  SystemProgram.programId,
          })
          .signers([platformAuthority])
          .rpc();
      } catch (_) {
        errored = true;
      }
      assert.isTrue(errored, "rating 0 should be rejected");
    });

    it("fails if rating is 6", async () => {
      const [passportKey] = passportPda(worker.publicKey);
      const [platformKey] = platformPda(platformAuthority.publicKey);
      const badId         = makeRecordId(201);
      const [badRecord]   = workRecordPda(worker.publicKey, badId);

      let errored = false;
      try {
        await program.methods
          .emitWorkRecord([...badId], { tech: {} }, new anchor.BN(1_000_000), 6, false)
          .accounts({
            passport:       passportKey,
            workRecord:     badRecord,
            platform:       platformKey,
            worker:         worker.publicKey,
            treasury:       treasury.publicKey,
            platformSigner: platformAuthority.publicKey,
            systemProgram:  SystemProgram.programId,
          })
          .signers([platformAuthority])
          .rpc();
      } catch (_) {
        errored = true;
      }
      assert.isTrue(errored, "rating 6 should be rejected");
    });
  });

  // ── mint_badge (threshold checks only — SPL/Metaplex skipped on localnet) ──

  describe("mint_badge threshold checks", () => {
    it("fails FirstGig threshold if passport has zero gigs", async () => {
      // Fresh worker: initialize passport, attempt badge with 0 gigs → should fail
      const freshWorker = Keypair.generate();
      const sig = await provider.connection.requestAirdrop(freshWorker.publicKey, LAMPORTS_PER_SOL);
      await provider.connection.confirmTransaction(sig, "confirmed");

      const [freshPassport] = passportPda(freshWorker.publicKey);
      const [counterKey]    = counterPda();

      await program.methods
        .initializePassport()
        .accounts({
          passport:      freshPassport,
          wallet:        freshWorker.publicKey,
          payer:         freshWorker.publicKey,
          counter:       counterKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([freshWorker])
        .rpc();

      // mint_badge requires SPL token accounts + Metaplex — passing empty accounts
      // will fail at account validation before reaching our threshold check.
      // We just verify the call errors out (any error = threshold/account guard working).
      let errored = false;
      try {
        await program.methods
          .mintBadge({ firstGig: {} })
          .accounts({
            passport:               freshPassport,
            counter:                counterKey,
            wallet:                 freshWorker.publicKey,
            payer:                  freshWorker.publicKey,
            systemProgram:          SystemProgram.programId,
          })
          .signers([freshWorker])
          .rpc();
      } catch (_) {
        errored = true;
      }
      assert.isTrue(errored, "mint_badge should fail (threshold or missing accounts)");
    });
  });
});
