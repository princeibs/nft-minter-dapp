import React from "react";
import { Button } from "react-bootstrap";
import PropTypes from "prop-types";
import "./Cover.scss";

const Cover = ({ name, coverImg, connect }) => {
  if (name) {
    return (
      <div className="d-flex justify-content-center flex-column text-center app__cover">
        <div className="mt-auto text-light mb-5">      
          <h1>{name}</h1>
          <p>Please connect your wallet to continue.</p>
          <Button
            onClick={connect}
            variant="outline-light"
            className="rounded-pill px-3 mt-3"
          >
            Connect Wallet
          </Button>
        </div>

        <p className="mt-auto text-secondary">Powered by Celo</p>
      </div>
    );
  }

  return null;
};

Cover.propTypes = {
  // props passed into this component
  name: PropTypes.string,
};

Cover.defaultProps = {
  name: "",
};

export default Cover;
