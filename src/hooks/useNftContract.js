import { useContract } from "./useContract";
import MultaVerseAbi from "../contracts/MultaVerse.json";
import MultaVerseAddress from "../contracts/MultaVerse-address.json";

// export interface for NFT contract
export const useNftContract = () =>
  useContract(MultaVerseAbi.abi, MultaVerseAddress.MultaVerse);
