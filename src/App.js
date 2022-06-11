import React from "react";
import Cover from "./components/Cover";
import { Notification } from "./components/ui/Notifications";
import Wallet from "./components/wallet";
import { useBalance, useGemContract } from "./hooks";

import Nfts from "./components/minter/nfts";
import { useContractKit } from "@celo-tools/use-contractkit";

import coverImg from "./assets/img/gem_img.jpg";
import "./App.css";

import { Container, Nav } from "react-bootstrap";

const App = function AppWrapper() {
  /*
    address : fetch the connected wallet address
    destroy: terminate connection to user wallet
    connect : connect to the celo blockchain
     */
  const { address, destroy, connect } = useContractKit();

  //  fetch user's celo balance using hook
  const { balance, getBalance } = useBalance();

  // initialize the NFT mint contract
  const gemContract = useGemContract()

  return (
    <>
      <Notification />

      {address ? (
        <Container fluid="md">
          <Nav className="justify-content-end pt-3 pb-5">
            <Nav.Item>
              {/*display user wallet*/}
              <Wallet
                address={address}
                amount={balance.CELO}
                symbol="CELO"
                destroy={destroy}
              />
            </Nav.Item>
          </Nav>
          <main>
            {/*list NFTs*/}
            <Nfts
              name="Gems Collection"
              updateBalance={getBalance}
              minterContract={gemContract}
            />
          </main>
        </Container>
      ) : (
        //  if user wallet is not connected display cover page
        <Cover
          name="Gems Collection"
          coverImg={coverImg}
          connect={connect}
        />
      )}
    </>
  );
};

export default App;
