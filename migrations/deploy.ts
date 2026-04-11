import * as anchor from "@coral-xyz/anchor";

module.exports = async function (provider: anchor.AnchorProvider) {
  anchor.setProvider(provider);
  // Program is deployed via `anchor deploy`. Nothing to migrate at launch.
};
