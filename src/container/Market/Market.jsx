import { useContractKit } from "@celo-tools/use-contractkit";
import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import PropTypes from "prop-types";
import { useNavigate } from "react-router";
import Nft from "../../components/ui/Card";
import Loader from "../../components/ui/Loader";
import { getNfts, fetchNftContractOwner } from "../../utils/minter";
import "./Market.scss";

const Market = ({ gemContract }) => {
  /* performActions : used to run smart contract interactions in order
   *  address : fetch the address of the connected wallet
   */
  const { performActions, address, kit } = useContractKit();
  const {defaultAccount} = kit;
  const navigate = useNavigate();

  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nftOwner, setNftOwner] = useState(null);

  const getAssets = useCallback(async () => {
    try {
      setLoading(true);

      // fetch all nfts from the smart contract
      const allNfts = await getNfts(gemContract);
      if (!allNfts) return;
      setNfts(allNfts);
    } catch (error) {
      console.log({ error });
    } finally {
      setLoading(false);
    }
  }, [gemContract]);

  const fetchContractOwner = useCallback(async (gemContract) => {
    // get the address that deployed the NFT contract
    const _address = await fetchNftContractOwner(gemContract);
    setNftOwner(_address);
  }, []);

  useEffect(() => {
    try {
      if (address && gemContract) {
        getAssets();
        fetchContractOwner(gemContract);
      }
    } catch (error) {
      console.log({ error });
    }
  }, [gemContract, address, getAssets, fetchContractOwner]);

  const buyToken = async (tokenId, gemValue) => {
    const coinsBalance = await gemContract.methods.getPointsBalance().call();
    if (coinsBalance < gemValue) {
      navigate("/buy-coins");
      return;
    };
    const txn = gemContract.methods.buyToken(Number(tokenId)).send({from: defaultAccount})  
  };

  if (address) {
    return (
      <div className="app__market">
        {!loading ? (
          <div className="app__market-market">
            <div className="app__market-heading">
              <h1 className="app__market-title">Market</h1>
            </div>
            <div className="app__market-body">
              {/* display all NFTs */}
              {nfts.length === 0 ? (
                <div>No NFT to display at the moment</div>
              ) : (
                nfts.map((_nft) => (
                  <Nft
                    key={_nft.tokenId}
                    nft={{
                      ..._nft,
                    }}
                    buyToken={buyToken}
                  />
                ))
              )}
            </div>
          </div>
        ) : (
          <Loader />
        )}
      </div>
    );
  }
  return null;
};

Market.propTypes = {
  // props passed into this component
  gemContract: PropTypes.instanceOf(Object),
  updateBalance: PropTypes.func.isRequired,
};

Market.defaultProps = {
  gemContract: null,
};

export default Market;
