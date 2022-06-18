import React, { useState, useCallback, useEffect } from "react";
import Identicon from "../../components/ui/Identicon";
import Navigation from "../Navigation/Navigation";
import { useGemContract, useBalance } from "../../hooks";
import { useContractKit } from "@celo-tools/use-contractkit";
import contractAddress from "../../contracts/GemNFT-address.json";
import Loader from "../../components/ui/Loader";
import { getMyTokens } from "../../utils/minter";
import "./Profile.scss";
import BigNumber from "bignumber.js";
import { formatBigNumber, truncateAddress } from "../../utils";

const NftCard = ({ nft, btnText }) => {
  const { tokenId, seller, value, name, image, description, properties } = nft;
  return (
    <div className="nft-card">
      <img src={image} />
      <div className="nft-details">
        <div className="nft-title">
          {name} (<span>#{tokenId}</span>)
        </div>
        <div className="nft-description">{description}</div>
        <div className="nft-props">
          {properties?.map((prop) => (
            <div className="props">{prop.value}</div>
          ))}
        </div>
        <hr className="card-hr" />
        <div className="sell-nft">
          <div className="sell-nft-btn">{btnText}</div>
        </div>
      </div>
    </div>
  );
};

const Profile = () => {
  const [loading, setLoading] = useState(false);
  const [tokensLength, setTokensLength] = useState(0);
  const [contractBalance, setContractBalance] = useState(0);
  const [nfts, setNfts] = useState([]);
  const gemContract = useGemContract();
  const { celoBalance, coinsBalance } = useBalance();
  const { kit } = useContractKit();
  const { defaultAccount } = kit;

  const getAssets = useCallback(async () => {
    try {
      setLoading(true);
      // fetch all nfts from the smart contract
      const allNfts = await getMyTokens(gemContract);
      if (!allNfts) return;
      setNfts(allNfts);
    } catch (error) {
      console.log({ error });
    } finally {
      setLoading(false);
    }
  }, [gemContract]);

  const getTotalTokensMinted = async () => {
    const tokens = await gemContract?.methods.getTokensLength().call();
    setTokensLength(tokens);
  };

  const getContractBalance = async () => {
    const txn = await gemContract.methods.contractBalance().call();
    setContractBalance(txn);
  };

  const claimContractFunds = async () => {
    const txn = gemContract.methods
      .claimContractFunds()
      .send({ from: defaultAccount });
    getAssets();
  };

  useEffect(() => {
    try {
      if (gemContract) {
        getAssets();
        getTotalTokensMinted();
        getContractBalance();
      }
    } catch (error) {
      console.log({ error });
    }
  }, [gemContract, getAssets]);

  return (
    <>
      <Navigation />
      {!loading ? (
        <div className="app__profile">
          {/* <div className="app__profile-subtitle">In Market</div>
          <hr className="hr__class" /> */}
          {/* <div className="app__profile-subtitle">Out of Market</div> */}
          <div className="app__profile-profile">
            <div className="profile-image">
              <Identicon address={defaultAccount} size={110} />
            </div>
            <div className="profile-info">
              <div className="profle-address">User: {truncateAddress(defaultAccount)}</div>
              <hr></hr>
              <div>CELO: {formatBigNumber(celoBalance.CELO)}</div>
              <div>cUSD: {formatBigNumber(celoBalance.cUSD)}</div>
              <div>Coins: {coinsBalance}</div>
            </div>
            <div className="contract-details">
              <div>Total tokens minted: {tokensLength}</div>
              <div>
                Contract Address: {truncateAddress(contractAddress.GemNFT)}
              </div>
              <div>
                Total Funds in Contract:{" "}
                {formatBigNumber(new BigNumber(contractBalance))} CELO{" "}
                <span className="profile-claim-btn" onClick={() => claimContractFunds()}>Claim</span>
              </div>
            </div>
          </div>
          <hr className="hr__class" />
          <div className="my-nfts">
            {nfts.length === 0 ? (
              <div className="no-nft-msg">No NFT to display at the moment</div>
            ) : (
              nfts.map((_nft) => (
                <NftCard
                  key={_nft.tokenId}
                  nft={{
                    ..._nft,
                  }}
                  btnText="Sell"
                />
              ))
            )}
          </div>
        </div>
      ) : (
        <Loader />
      )}
    </>
  );
};

export default Profile;
