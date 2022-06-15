import React, { useState, useCallback, useEffect } from "react";
import coinImg from "../../assets/img/coin_img.png";
import Navigation from "../Navigation/Navigation";
import { useGemContract } from "../../hooks";
import Loader from "../../components/ui/Loader";
import { getMyTokens } from "../../utils/minter";
import "./Profile.scss";

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
  const [nfts, setNfts] = useState([]);
  const gemContract = useGemContract();

  const getAssets = useCallback(async () => {
    try {
      setLoading(true);

      // fetch all nfts from the smart contract

      const allNfts = await getMyTokens(gemContract);
      if (!allNfts) return;
      setNfts(allNfts);
    } catch (error) {
      console.log({ error });
      console.log("in profile ...");
    } finally {
      setLoading(false);
    }
  }, [gemContract]);

  useEffect(() => {
    try {
      if (gemContract) {
        getAssets();
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
          <div className="app__profile-subtitle">Out of Market</div>
          <hr className="hr__class" />
          {nfts.length === 0 ? (
            <div>No NFT to display at the moment</div>
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
      ) : (
        <Loader />
      )}
    </>
  );
};

export default Profile;
