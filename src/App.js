import React, {useState, useEffect, useCallback} from "react";

import { Notification } from "./components/ui/Notifications";
import { useContractKit } from "@celo-tools/use-contractkit";

import Navigation from "./container/Navigation/Navigation";
import Market from "./container/Market/Market";
import Cover from "./components/Cover";
import { useBalance, useNftContract } from "./hooks";
import coverImg from "./assets/img/galaxies.jpg";
import { fetchNftContractOwner } from "./utils/minter";
import "./index.css";
import "./App.scss";

const App = function AppWrapper() {
  const [nftOwner, setNftOwner] = useState()
  /*
    address : fetch the connected wallet address
    destroy: terminate connection to user wallet
    connect : connect to the celo blockchain
     */
  const { address, connect } = useContractKit();

  //  fetch user's celo balance using hook
  const { getBalance } = useBalance();

  // initialize the NFT mint contract
  const nftContract = useNftContract();

  const fetchContractOwner = useCallback(async (nftContract) => {
    // get the address that deployed the NFT contract
    const _address = await fetchNftContractOwner(nftContract);
    setNftOwner(_address);
  }, []);

  useEffect(() => {
    try {
      if (address && nftContract) {
        fetchContractOwner(nftContract);
      }
    } catch (error) {
      console.log({ error });
    }
  }, [nftContract, address, fetchContractOwner]);

  return (
    <div className="app__base">
      <Notification />
      {address ? (
        <>        
          <Navigation owner={nftOwner}/>
          <Market updateBalance={getBalance} nftContract={nftContract} />
        </>
      ) : (
        //  if user wallet is not connected display cover page
        <Cover name="MultaVerse" coverImg={coverImg} connect={connect} />
      )}
    </div>
  );
};

export default App;
