import { useState, useEffect, useCallback } from "react";
import { useContractKit } from "@celo-tools/use-contractkit";
import { useGemContract } from "../hooks";

export const useBalance = () => {
  const { address, kit } = useContractKit();
  const [celoBalance, setCeloBalance] = useState(0);
  const [coinsBalance, setCoinsBalance] = useState(1);
  const gemContract = useGemContract();

  const getBalance = useCallback(async () => {
    // fetch a connected wallet token balance
    const balance = await kit.getTotalBalance(address);
    const coins = await gemContract?.methods.getCoinsBalance().call();
    // const coins = 99;

    setCeloBalance(balance);
    setCoinsBalance(coins)
  }, [address, kit, gemContract]);

  useEffect(() => {
    if (address) getBalance();
  }, [address, getBalance]);

  // console.log("pts bal -> " + coinsBalance)
  return {
    celoBalance,
    coinsBalance,
    getBalance,
  };
};
