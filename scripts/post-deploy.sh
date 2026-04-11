#!/usr/bin/env bash
# Run this immediately after `anchor deploy --provider.cluster devnet`
# It reads the deployed program ID, updates all relevant files, and pushes.

set -e

PROGRAM_NAME="reputation_passport"
KEYPAIR="target/deploy/${PROGRAM_NAME}-keypair.json"

if [ ! -f "$KEYPAIR" ]; then
  echo "Error: $KEYPAIR not found. Run 'anchor build' first."
  exit 1
fi

PROGRAM_ID=$(solana-keygen pubkey "$KEYPAIR")
echo "Program ID: $PROGRAM_ID"

# 1. Write to shared/program_id.txt (Instance B reads this)
echo "$PROGRAM_ID" > shared/program_id.txt
echo "✓ shared/program_id.txt updated"

# 2. Copy IDL to shared/idl/
cp target/idl/${PROGRAM_NAME}.json shared/idl/${PROGRAM_NAME}.json
echo "✓ shared/idl/${PROGRAM_NAME}.json updated"

# 3. Update Anchor.toml [programs.devnet]
sed -i.bak "s|reputation_passport = \".*\"|reputation_passport = \"$PROGRAM_ID\"|g" Anchor.toml
rm -f Anchor.toml.bak
echo "✓ Anchor.toml updated"

# 4. Update declare_id! in lib.rs
sed -i.bak "s|declare_id!(\".*\")|declare_id!(\"$PROGRAM_ID\")|g" programs/reputation-passport/src/lib.rs
rm -f programs/reputation-passport/src/lib.rs.bak
echo "✓ lib.rs declare_id! updated"

# 5. Commit and push
git add shared/program_id.txt shared/idl/${PROGRAM_NAME}.json Anchor.toml programs/reputation-passport/src/lib.rs
git commit -m "deploy: devnet program ID $PROGRAM_ID"
git push

echo ""
echo "✓ Done. Instance B can now pull and wire up chain reads."
echo ""
echo "Next step: run the seed script:"
echo "  ANCHOR_PROVIDER_URL=https://api.devnet.solana.com \\"
echo "  ANCHOR_WALLET=~/.config/solana/id.json \\"
echo "  npx ts-node scripts/seed-devnet.ts"
