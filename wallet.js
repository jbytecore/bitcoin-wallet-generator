const readline = require("readline");
const path = require("path");
const bitcoin = require("bitcoinjs-lib");
const bip39 = require("bip39");
const BIP32Factory = require("bip32").default || require("bip32");
const ecc = require("tiny-secp256k1");

const { saveQRCode } = require("./utils/qr");
const { logWallet } = require("./utils/log");

bitcoin.initEccLib(ecc);
const bip32 = BIP32Factory(ecc);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function generateWallet() {
  const mnemonic = bip39.generateMnemonic();
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const root = bip32.fromSeed(seed);
  const child = root.derivePath("m/84'/0'/0'/0/0");

  const { address } = bitcoin.payments.p2wpkh({
    pubkey: Buffer.from(child.publicKey),
  });

  const wif = child.toWIF();

  console.log("\n==============")
  console.log("Bitcoin Wallet");
  console.log("==============");
  console.log("Address      :", address);
  console.log("Private Key  :", wif);
  console.log("Mnemonic     :", mnemonic);

  rl.question("\nEnter QR filename (without .png): ", async (inputName) => {
    const filename = inputName.trim() || "btc_address";
    const uri = `bitcoin:${address}`;

    try {
      const qrPath = await saveQRCode(uri, filename);
      console.log(`QR code saved at: ${path.relative(process.cwd(), qrPath)}`);

      const logPath = logWallet({ address, wif, mnemonic });
      console.log(
        `Wallet log saved at: ${path.relative(process.cwd(), logPath)}\n`
      );
    } catch (err) {
      console.error("Error:", err.message);
    } finally {
      rl.close();
    }
  });
}

generateWallet();
