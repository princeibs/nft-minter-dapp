import { create as ipfsHttpClient } from "ipfs-http-client";
import axios from "axios";

// initialize IPFS
const client = ipfsHttpClient("https://ipfs.infura.io:5001/api/v0");

// mint an NFT
export const createNft = async (
  gemContract,
  performActions,
  { name, gemValue, description, ipfsImage, properties }
) => {
  await performActions(async (kit) => {
    if (!name || !description || !ipfsImage) return;
    const { defaultAccount } = kit;

    // convert NFT metadata to JSON format
    const data = JSON.stringify({
      name,
      description,
      image: ipfsImage,
      owner: defaultAccount,
      properties,
    });

    try {
      // save NFT metadata to IPFS
      const added = await client.add(data);

      // IPFS url for uploaded metadata
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;

      console.log("Gem Value -> " + gemValue);
      // mint the NFT and save the IPFS url toexport {default as BuyPoints} from "./BuyCoins/BuyCoins" the blockchain
      let transaction = await gemContract.methods
        .mintToken(url, gemValue)
        .send({ from: defaultAccount });

      return transaction;
    } catch (error) {
      console.log("Error uploading file: ", error);
    }
  });
};

// function to upload a file to IPFS
export const uploadToIpfs = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const added = await client.add(file, {
      progress: (prog) => console.log(`received: ${prog}`),
    });
    return `https://ipfs.infura.io/ipfs/${added.path}`;
  } catch (error) {
    console.log("Error uploading file: ", error);
  }
};

// fetch all NFTs on the smart contract
export const getNfts = async (gemContract) => {
  try {
    console.log("before call ...");
    const data = await gemContract.methods.getAllMarketTokens().call();
    console.log("len -> " + data.length);
    const tokens = await Promise.all(
      data.map(async (token) => {
        const tokenUri = await gemContract.methods
          .tokenURI(token.tokenId)
          .call();
        const meta = await fetchNftMeta(tokenUri);
        return {
          tokenId: Number(token.tokenId),
          value: Number(token.value),
          owner: token.owner,
          seller: token.seller,
          claimed: token.claimed,
          name: meta.data.name,
          image: meta.data.image,
          description: meta.data.description,
          properties: meta.data.properties,
        };
      })
    );
    return tokens;
  } catch (e) {
    console.log(e);
  }
};

// fetch all my tokens
export const getMyTokens = async (gemContract) => {
  try {
    const res = await gemContract.methods.getMyTokens().call();
    const tokens = await Promise.all(
      res.map(async (tokenId) => {
        const tokenUri = await gemContract.methods.tokenURI(tokenId).call();
        const meta = await fetchNftMeta(tokenUri);
        return {
          tokenId: Number(tokenId),
          name: meta.data.name,
          image: meta.data.image,
          description: meta.data.description,
          properties: meta.data.properties,
        };
      })
    );
    console.log("mytkns -> " + JSON.stringify(tokens, null, 4))
    return tokens;
  } catch (e) {
    console.log("getmytokensErr -> " + e);
    console.log("errrrrrrrrrr")
  }
};

// get the metedata for an NFT from IPFS
export const fetchNftMeta = async (ipfsUrl) => {
  try {
    if (!ipfsUrl) return null;
    // console.log("Before axios -> " + ipfsUrl);
    const meta = await axios.get(ipfsUrl);
    // console.log("After axios -> " + meta);
    return meta;
  } catch (e) {
    console.log({ e });
  }
};

// get the owner address of an NFT
export const fetchNftOwner = async (gemContract, index) => {
  try {
    return await gemContract.methods.ownerOf(index).call();
  } catch (e) {
    console.log({ e });
  }
};

// get the address that deployed the NFT contract
export const fetchNftContractOwner = async (gemContract) => {
  try {
    let owner = await gemContract.methods.owner().call();
    return owner;
  } catch (e) {
    console.log({ e });
  }
};
