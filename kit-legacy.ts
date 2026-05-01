
import {
  airdropFactory,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  getSignatureFromTransaction,
  lamports,
  pipe,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  signTransactionMessageWithSigners,
  generateKeyPairSigner,
} from "@solana/kit";
import { getAddMemoInstruction } from "@solana-program/memo";

const SOL = 1_000_000_000n;

const httpURL = "https://api.devnet.solana.com";
const webSocketURL = "wss://api.devnet.solana.com";

const rpc = createSolanaRpc(httpURL);
const rpcSubscriptions = createSolanaRpcSubscriptions(webSocketURL);

const user = await generateKeyPairSigner();

const currentBalance = await rpc.getBalance(user.address, {
  commitment: "finalized"
}).send();

const airdropAmount = lamports(1n * SOL);

if (currentBalance.value < airdropAmount) {
  const airdrop = airdropFactory({ rpc, rpcSubscriptions });
  await airdrop({
    commitment: "finalized",
    lamports: airdropAmount,
    recipientAddress: user.address,
  });
}

const memoInstruction = getAddMemoInstruction({
  memo: "hello world!",
});

const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

let transactionMessage = pipe(
  createTransactionMessage({ version: 0 }),
  (message) => setTransactionMessageFeePayerSigner(user, message),
  (message) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, message),
  (message) => appendTransactionMessageInstructions([memoInstruction], message)
);

const signedTransaction = await signTransactionMessageWithSigners(transactionMessage);

const signature = getSignatureFromTransaction(signedTransaction);

const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
  rpc,
  rpcSubscriptions,
});

await sendAndConfirmTransaction(signedTransaction as Parameters<typeof sendAndConfirmTransaction>[0], {
  commitment: "confirmed",
  skipPreflight: true,
});

console.log(signature);
