import {useContract} from './useContract';
import GemAbi from '../contracts/GemNFT.json';
import GemContractAddress from '../contracts/GemNFT-address.json';


// export interface for NFT contract
export const useGemContract = () => useContract(GemAbi.abi, GemContractAddress.GemNFT);