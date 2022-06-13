import { useContractKit } from "@celo-tools/use-contractkit";
import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import PropTypes from "prop-types";
import AddNfts from "../../components/ui/Add";
import Nft from "../../components/ui/Card";
import Loader from "../../components/ui/Loader";
import {
  NotificationSuccess,
  NotificationError,
} from "../../components/ui/Notifications";
import { getNfts, createNft, fetchNftContractOwner } from "../../utils/minter";
import "./Market.scss";

const Market = ({ minterContract }) => {
  /* performActions : used to run smart contract interactions in order
   *  address : fetch the address of the connected wallet
   */
  const { performActions, address } = useContractKit();
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nftOwner, setNftOwner] = useState(null);

  const getAssets = useCallback(async () => {
    try {
      setLoading(true);

      // fetch all nfts from the smart contract
      const allNfts = await getNfts(minterContract);
      if (!allNfts) return;
      setNfts(allNfts);
    } catch (error) {
      console.log({ error });
    } finally {
      setLoading(false);
    }
  }, [minterContract]);

  const addNft = async (data) => {
    try {
      setLoading(true);

      // create an nft functionality
      await createNft(minterContract, performActions, data);
      toast(<NotificationSuccess text="Updating NFT list...." />);
      getAssets();
    } catch (error) {
      console.log({ error });
      toast(<NotificationError text="Failed to create an NFT." />);
    } finally {
      setLoading(false);
    }
  };

  const fetchContractOwner = useCallback(async (minterContract) => {
    // get the address that deployed the NFT contract
    const _address = await fetchNftContractOwner(minterContract);
    setNftOwner(_address);
  }, []);

  useEffect(() => {
    try {
      if (address && minterContract) {
        getAssets();
        fetchContractOwner(minterContract);
      }
    } catch (error) {
      console.log({ error });
    }
  }, [minterContract, address, getAssets, fetchContractOwner]);
  if (address) {
    return (
      <div className="app__market">
        {!loading ? (
          <div className="app__market-market">
            <div className="app__market-heading">
              <h1 className="app__market-title">Market</h1>

              {/* give the add NFT permission to user who deployed the NFT smart contract */}
              {nftOwner === address ? (
                <AddNfts save={addNft} address={address} />
              ) : null}
            </div>
            <div className="app__market-body">
              {/* display all NFTs */}
              {nfts.length == 0 ? (
                <div>No NFT to display at the moment</div>
              ) : (
                nfts.map((_nft) => (
                  <Nft
                    key={_nft.index}
                    nft={{
                      ..._nft,
                    }}
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
  minterContract: PropTypes.instanceOf(Object),
  updateBalance: PropTypes.func.isRequired,
};

Market.defaultProps = {
  minterContract: null,
};

export default Market;
