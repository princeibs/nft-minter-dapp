import { useState, useEffect, useCallback } from "react";
import { useContractKit } from "@celo-tools/use-contractkit";
import { useGemContract } from "../hooks";

export const useBalance = () => {
  const { address, kit } = useContractKit();
  const [celoBalance, setCeloBalance] = useState(0);
  const [pointsBalance, setPointsBalance] = useState(1);
  const gemContract = useGemContract();

  const getBalance = useCallback(async () => {
    // fetch a connected wallet token balance
    const balance = await kit.getTotalBalance(address);
    const points = await gemContract?.methods.getPointsBalance().call();
    // const points = 99;

    setCeloBalance(balance);
    setPointsBalance(points)
  }, [address, kit, gemContract]);

  useEffect(() => {
    if (address) getBalance();
  }, [address, getBalance]);

  // console.log("pts bal -> " + pointsBalance)
  return {
    celoBalance,
    pointsBalance,
    getBalance,
  };
};
