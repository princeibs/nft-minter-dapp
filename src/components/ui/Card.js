import React from "react";
import PropTypes from "prop-types";
import { useContractKit } from "@celo-tools/use-contractkit";
import coinImg from "../../assets/img/coin_img.png";
import "./Card.scss";

const NftCard = ({ nft }) => {
  const { index, seller, value, name, image, description, properties } = nft;
  const { kit } = useContractKit();
  const { defaultAccount } = kit;

  return (
    <>
      <div className="nft-card">
        <img src={image} />
        <div className="nft-details">
          <div className="nft-title">
            {name} (<span>#{index}</span>)
          </div>
          <div className="nft-description">{description}</div>
          <div className="nft-props">
            {properties?.map((prop) => (
              <div className="props">{prop.value}</div>
            ))}
          </div>
          <hr className="card-hr" />
          <div className="buy-nft">
            <div className="nft-cost">
              <span>
                <img src={coinImg} />
              </span>
              {value}
            </div>
            {seller == defaultAccount ? (
              <div>Owned</div>
            ) : (
              <div className="buy-nft-btn">Buy</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

NftCard.propTypes = {
  // props passed into this component
  nft: PropTypes.instanceOf(Object).isRequired,
};

export default NftCard;
