import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import idl from "../idl/reputation_passport.json";

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ?? "3NQPuNCmLvouhRYJD4LxEFNqg42ooTzh272m4f2BVgkb"
);

export function getProgram(connection: Connection, wallet: any): Program {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  return new Program(idl as Idl, provider);
}

// PDA helpers
export function passportPda(wallet: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("passport"), wallet.toBuffer()],
    PROGRAM_ID
  );
}

export function workRecordPda(worker: PublicKey, recordId: Buffer): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("work_record"), worker.toBuffer(), recordId],
    PROGRAM_ID
  );
}

export function platformPda(authority: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("platform"), authority.toBuffer()],
    PROGRAM_ID
  );
}
