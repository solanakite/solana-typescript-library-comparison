import { createClient, lamports } from "@solana/kit";
import { solanaDevnetRpc } from "@solana/kit-plugin-rpc";
import { airdropSigner, generatedSigner } from "@solana/kit-plugin-signer";
import { getAddMemoInstruction } from "@solana-program/memo";

const SOL = 1_000_000_000n;

const client = await createClient()
  .use(generatedSigner())
  .use(solanaDevnetRpc())
  .use(airdropSigner(lamports(1n * SOL)));

const result = await client.sendTransaction([
  getAddMemoInstruction({ memo: "hello world!" }),
]);

console.log(result.context.signature);
