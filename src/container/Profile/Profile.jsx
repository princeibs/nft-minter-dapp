import React, { useState, useCallback, useEffect } from "react";
import Identicon from "../../components/ui/Identicon";
import Navigation from "../Navigation/Navigation";
import { useNftContract, useBalance } from "../../hooks";
import { useContractKit } from "@celo-tools/use-contractkit";
import contractAddress from "../../contracts/MultaVerse-address.json";
import Loader from "../../components/ui/Loader";
import {
  getMyTokens,
  getNfts,
  fetchNftContractOwner,
} from "../../utils/minter";
import "./Profile.scss";
import BigNumber from "bignumber.js";
import { formatBigNumber, truncateAddress } from "../../utils";
import MintNFT from "../Mint/MintNFT";
import {Button} from "react-bootstrap";

const NftCard = ({ nft, btnText, handleClick }) => {
  const { tokenId, value, name, image, description, properties } = nft;
  return (
    <div className="nft-card">
      <img alt="nft-preview" src={image} />
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
        {btnText && (
          <div>
            <hr className="card-hr" />
            <div className="sell-nft">
              <div
                onClick={() => handleClick(tokenId, value)}
                className="sell-nft-btn"
              >
                {btnText}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Profile = () => {
  const [loading, setLoading] = useState(false);
  const [tokensLength, setTokensLength] = useState(0);
  const [contractBalance, setContractBalance] = useState(0);
  const [nfts, setNfts] = useState([]);
  const [marketTokens, setMarketTokens] = useState([]);
  const [showMint, setShowMint] = useState(false);
  const nftContract = useNftContract();
  const { celoBalance, coinsBalance } = useBalance();
  const { kit } = useContractKit();
  const { defaultAccount } = kit;
  const [nftOwner, setNftOwner] = useState();

  const getAssets = useCallback(async () => {
    try {
      setLoading(true);
      // fetch all nfts from the smart contract
      const allNfts = await getMyTokens(nftContract);
      const allMarketTokens = await getNfts(nftContract);
      if (!(allNfts && allMarketTokens)) return;
      setNfts(allNfts);
      setMarketTokens(allMarketTokens);
    } catch (error) {
      console.log({ error });
    } finally {
      setLoading(false);
    }
  }, [nftContract]);

  const getTotalTokensMinted = async () => {
    const tokens = await nftContract?.methods.getTokensLength().call();
    setTokensLength(tokens);
  };

  const getContractBalance = async () => {
    const txn = await nftContract.methods.contractBalance().call();
    setContractBalance(txn);
  };

  const claimContractFunds = async () => {
    const txn = nftContract.methods
      .claimContractFunds()
      .send({ from: defaultAccount });
    getAssets();
  };

  const fetchContractOwner = useCallback(async (nftContract) => {
    // get the address that deployed the NFT contract
    const _address = await fetchNftContractOwner(nftContract);
    setNftOwner(_address);
  }, [defaultAccount]);

  useEffect(() => {
    try {
      if (nftContract) {
        getAssets();
        getTotalTokensMinted();
        fetchContractOwner(nftContract);
        nftOwner == defaultAccount && getContractBalance();
      }
    } catch (error) {
      console.log({ error });
    }
  }, [nftContract, getAssets]);

  const sellToken = async (tokenId, tokenValue) => {
    await nftContract.methods
      .sendTokenToMarket(tokenId, tokenValue)
      .send({ from: defaultAccount });
    getAssets();
  };

  return (
    <>
      <Navigation owner={nftOwner} />
      {!loading ? (
        <div className="app__profile">
          <div className="app__profile-profile">
            <div className="profile-image">
              <Identicon address={defaultAccount} size={110} />
            </div>
            <div className="profile-info">
              <div className="profle-address">
                User: {truncateAddress(defaultAccount)}
              </div>
              <hr></hr>
              <div>CELO: {formatBigNumber(celoBalance.CELO)}</div>
              <div>cUSD: {formatBigNumber(celoBalance.cUSD)}</div>
              <div>Coins: {coinsBalance}</div>
              <Button  variant={'dark'} onClick={ () => setShowMint(true)}>Mint Token</Button>
            </div>
            {nftOwner == defaultAccount && (
              <div className="contract-details">
                <div>Total tokens minted: {tokensLength}</div>
                <div>
                  Contract Address:{" "}
                  {truncateAddress(contractAddress.MultaVerse)}
                </div>
                <div>
                  Total Funds in Contract:{" "}
                  {formatBigNumber(new BigNumber(contractBalance))} CELO{" "}
                  <span
                    className="profile-claim-btn"
                    onClick={() => claimContractFunds()}
                  >
                    Claim
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="app__profile-subtitle">
            In Market
            <hr className="hr__class" />
          </div>

          <div className="my-nfts">
            {marketTokens.length === 0 ? (
              <div className="no-nft-msg">No NFT to display at the moment</div>
            ) : (
              marketTokens
                .filter((mkt) => mkt.seller == defaultAccount)
                .map((nft) => (
                  <NftCard
                    key={nft.tokenId}
                    nft={{
                      ...nft,
                    }}
                    btnText=""
                    handleClick={sellToken}
                  />
                ))
            )}
          </div>

          <div className="app__profile-subtitle">
            Out of Market
            <hr className="hr__class" />
          </div>
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
                  handleClick={sellToken}
                />
              ))
            )}
          </div>
          {
            showMint && (
                  <MintNFT closeModal={()=>{setShowMint(false)}} />)
          }

        </div>
      ) : (
        <Loader />
      )}
    </>
  );
};

export default Profile;
