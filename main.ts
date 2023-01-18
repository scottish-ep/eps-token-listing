// as used in https://www.youtube.com/watch?v=DQbt0-riooo

import * as mpl from "@metaplex-foundation/mpl-token-metadata";
import * as solanaWeb3 from "@solana/web3.js";
import * as anchor from '@project-serum/anchor';

export function loadWalletKey(keypairFile:string): solanaWeb3.Keypair {
    const fs = require("fs");
    console.log(fs.readFileSync(keypairFile).toString());
    const loaded = solanaWeb3.Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(fs.readFileSync(keypairFile).toString())),
    );
    return loaded;
  }

const INITIALIZE = false;

async function main(){
    console.log("let's name some tokens!");
    const myKeypair = loadWalletKey("wallet_key.json");

    const mint = new solanaWeb3.PublicKey("DueLHA7mPa54CXkye47L9kqh1vDiFmh44uhmwAYNukri");
    const seed1 = Buffer.from(anchor.utils.bytes.utf8.encode("metadata"));
    const seed2 = Buffer.from(mpl.PROGRAM_ID.toBytes());
    const seed3 = Buffer.from(mint.toBytes());
    const [metadataPDA, _bump] = solanaWeb3.PublicKey.findProgramAddressSync([seed1, seed2, seed3], mpl.PROGRAM_ID);
    const accounts = {
        metadata: metadataPDA,
        mint,
        mintAuthority: myKeypair.publicKey,
        payer: myKeypair.publicKey,
        updateAuthority: myKeypair.publicKey,
    }
    const dataV2 = {
        name: "EP Token",
        symbol: "EPS",
        uri: "https://raw.githubusercontent.com/scottish-ep/eps-token-listing/main/metadata.json",
        // we don't need that
        sellerFeeBasisPoints: 0,
        creators: null,
        collection: null,
        uses: null
    }
    let ix;
    if (INITIALIZE) {
        const args =  {
            createMetadataAccountArgsV2: {
                data: dataV2,
                isMutable: true
            }
        };
        ix = mpl.createCreateMetadataAccountV2Instruction(accounts, args);
    } else {
        const args =  {
            updateMetadataAccountArgsV2: {
                data: dataV2,
                isMutable: true,
                updateAuthority: myKeypair.publicKey,
                primarySaleHappened: true
            }
        };
        ix = mpl.createUpdateMetadataAccountV2Instruction(accounts, args)
    }
    const tx = new solanaWeb3.Transaction();
    tx.add(ix);
    const connection = new solanaWeb3.Connection("https://api.devnet.solana.com");
    const txid = await solanaWeb3.sendAndConfirmTransaction(connection, tx, [myKeypair]);
    console.log(txid);

}

main();
