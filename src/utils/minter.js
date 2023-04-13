import axios from "axios";
import { Web3Storage } from "web3.storage/dist/bundle.esm.min.js";
import Web3 from "web3";


const client = new Web3Storage({
  token: process.env.REACT_APP_WEB3_STORAGE_API_KEY
});

const web3 = new Web3();

// Remove whitespaces characters from name
const formatName = (name) => {
  return encodeURI(name)
}

// Convert data to object file
const convertObjectToFile = (data) => {
  const blob = new Blob([JSON.stringify(data)], {type: "application/json"});
  const files = [new File([blob], `${data.name}.json`)];
  return files;
} 

// mint an NFT
export const createNft = async (
  nftContract,
  performActions,
  { name, nftValue, description, ipfsImage, properties }
) => {
  await performActions(async (kit) => {
    if (!name || !description || !ipfsImage) return;
    const { defaultAccount } = kit;

    // convert NFT metadata to JSON format
    const data = {
      name,
      description,
      image: ipfsImage,
      owner: defaultAccount,
      properties,
    };

    try {
        const fileName = formatName(name)
        const files = convertObjectToFile(data);
        const result = await client.put(files)
        const tokenUri = `https://${result}.ipfs.w3s.link/${fileName}.json`;

      // mint the NFT and save the IPFS url to the blockchain
      let transaction = await nftContract.methods
        .mintToken(tokenUri, nftValue)
        .send({ from: defaultAccount });

      return transaction;
    } catch (error) {
      console.log("Error uploading file: ", error);
    }
  });
};

// function to upload a file to IPFS
export const uploadToIpfs = async (e) => {
  e.preventDefault();
  try {
    const files = e.target.files
    const file = files[0];
    const fileName = file.name;
    const imageName = formatName(fileName);
    const cid = await client.put(files)
    const url = `https://${cid}.ipfs.w3s.link/${imageName}`
    return url
} catch (e) {
  console.log("Failed to upload image to ipfs: " + e)
}
};

// fetch all NFTs on the smart contract
export const getNfts = async (nftContract) => {
  try {
    const data = await nftContract.methods.getAllMarketTokens().call();
    const tokens = await Promise.all(
      data.map(async (token) => {
        const tokenUri = await nftContract.methods
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
export const getMyTokens = async (nftContract) => {
  try {
    const res = await nftContract.methods.getMyTokens().call();
    const tokens = await Promise.all(
      res.map(async (tokenId) => {
        const tokenUri = await nftContract.methods.tokenURI(tokenId).call();
        const value = await nftContract.methods.marketTokens(tokenId).call();
        const meta = await fetchNftMeta(tokenUri);
        return {
          tokenId: Number(tokenId),
          name: meta.data.name,
          value: value.value,
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

// get the metedata for an NFT from IPFS
export const fetchNftMeta = async (ipfsUrl) => {
  try {
    if (!ipfsUrl) return null;
    const meta = await axios.get(ipfsUrl);
    return meta;
  } catch (e) {
    console.log({ e });
  }
};

// get the owner address of an NFT
export const fetchNftOwner = async (nftContract, index) => {
  try {
    return await nftContract.methods.ownerOf(index).call();
  } catch (e) {
    console.log({ e });
  }
};

// get the address that deployed the NFT contract
export const fetchNftContractOwner = async (nftContract) => {
  try {
    let owner = await nftContract.methods.owner().call();
    return owner;
  } catch (e) {
    console.log({ e });
  }
};
