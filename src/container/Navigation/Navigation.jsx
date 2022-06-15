import React, { useEffect } from "react";
import { useContractKit } from "@celo-tools/use-contractkit";
import { Nav } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useBalance } from "../../hooks";
import Wallet from "../../components/wallet/Wallet";
import "./Navigation.scss";

const Navigation = () => {
  /*
    address : fetch the connected wallet address
    destroy: terminate connection to user wallet
    connect : connect to the celo blockchain
     */

  const { address, destroy, kit } = useContractKit();

  //  fetch user's celo balance using hook
  const { celoBalance, pointsBalance } = useBalance();
  const { defaultAccount } = kit;

  return (
    <div className="app__nav">
      <div className="app__nav-list">
        <div className="app__title">
          <Link to="/">GEM</Link>
        </div>
        <div className="app__nav-item">
          <Link to="/">Market</Link>
        </div>
        <div className="app__nav-item">
          <Link to="/play">Play</Link>
        </div>
        <div className="app__nav-item">
          <Link to="/profile">Profile</Link>
        </div>
        <div className="app__nav-item mint-btn">
          <Link to="/mint">Mint</Link>
        </div>
      </div>
      <Nav className="app__nav-more">
        <Nav.Item>
          {/*display user wallet*/}
          <Wallet
            address={address}
            amount={celoBalance.CELO}
            points={pointsBalance}
            symbol="CELO"
            destroy={destroy}
          />
        </Nav.Item>
      </Nav>
    </div>
  );
};

export default Navigation;
