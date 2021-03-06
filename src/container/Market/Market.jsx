import { useContractKit } from "@celo-tools/use-contractkit";
import React, { useEffect, useState, useCallback } from "react";
import BigNumber from "bignumber.js";
import { toast } from "react-toastify";
import PropTypes from "prop-types";
import { useNavigate } from "react-router";
import Nft from "../../components/ui/Card";
import Loader from "../../components/ui/Loader";
import { getNfts, fetchNftContractOwner } from "../../utils/minter";
import "./Market.scss";
import { ERC20_DECIMALS } from "../../utils/constants";

const Market = ({ nftContract, updateBalance }) => {
  /* performActions : used to run smart contract interactions in order
   *  address : fetch the address of the connected wallet
   */
  const { address, kit } = useContractKit();
  const { defaultAccount } = kit;
  const navigate = useNavigate();

  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nftOwner, setNftOwner] = useState(null);

  const getAssets = useCallback(async () => {
    try {
      setLoading(true);

      // fetch all nfts from the smart contract
      const allNfts = await getNfts(nftContract);
      if (!allNfts) return;
      setNfts(allNfts);
    } catch (error) {
      console.log({ error });
    } finally {
      setLoading(false);
    }
  }, [nftContract]);

  const fetchContractOwner = useCallback(async (nftContract) => {
    // get the address that deployed the NFT contract
    const _address = await fetchNftContractOwner(nftContract);
    setNftOwner(_address);
  }, []);

  useEffect(() => {
    try {
      if (address && nftContract) {
        getAssets();
        updateBalance();
        fetchContractOwner(nftContract);
      }
    } catch (error) {
      console.log({ error });
    }
  }, [nftContract, address, getAssets, fetchContractOwner]);

  const buyToken = async (tokenId, nftValue) => {
    let txn;
    const coinsBalance = await nftContract.methods.getCoinsBalance().call();
    const value = new BigNumber(nftValue / 100)
      .shiftedBy(ERC20_DECIMALS)
      .toString();
    if (coinsBalance < nftValue) {
      txn = await nftContract.methods
        .buyTokenWithFund(tokenId)
        .send({ from: defaultAccount, value: value });
    } else {
      txn = await nftContract.methods
        .buyTokenWithCoins(tokenId)
        .send({ from: defaultAccount });
    }
    getAssets();
    navigate("/");
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
  nftContract: PropTypes.instanceOf(Object),
  updateBalance: PropTypes.func.isRequired,
};

Market.defaultProps = {
  nftContract: null,
};

export default Market;
