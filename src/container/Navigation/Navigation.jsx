import React from "react";
import { useContractKit } from "@celo-tools/use-contractkit";
import { Nav } from "react-bootstrap";
import { Link } from "react-router-dom";

import Wallet from "../../components/wallet";
import { useBalance } from "../../hooks";
import "./Navigation.scss";

const Navigation = () => {
  /*
    address : fetch the connected wallet address
    destroy: terminate connection to user wallet
    connect : connect to the celo blockchain
     */
  const { address, destroy, connect } = useContractKit();

  //  fetch user's celo balance using hook
  const { balance, getBalance } = useBalance();

  return (
    <div className="app__nav">
      <div className="app__nav-list">
        <Link to="/">
          <div className="app__title">GEM</div>
        </Link>
        <Link to="/">
          <div className="app__nav-item">Market</div>
        </Link>
        <Link to="play">
          <div className="app__nav-item">Play</div>
        </Link>
        <Link to="profile">
          <div className="app__nav-item">Profile</div>
        </Link>
      </div>
      <Nav className="app__nav-more">
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
    </div>
  );
};

export default Navigation;
