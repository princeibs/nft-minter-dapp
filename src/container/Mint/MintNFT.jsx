/* eslint-disable react/jsx-filename-extension */
import React, { useState, useEffect, useCallback } from "react";
import { useContractKit } from "@celo-tools/use-contractkit";
import { toast } from "react-toastify";
import { Button, Modal, Form, FloatingLabel } from "react-bootstrap";
import { uploadToIpfs } from "../../utils/minter";
import { useGemContract } from "../../hooks";
import BigNumber from "big-number/big-number";
import { useNavigate } from "react-router-dom";
import Loader from "../../components/ui/Loader";
import {
  NotificationSuccess,
  NotificationError,
} from "../../components/ui/Notifications";
import { createNft } from "../../utils/minter";

const MintNFT = () => {
  const [name, setName] = useState("");
  const [gemValue, setGemValue] = useState(0);
  const [ipfsImage, setIpfsImage] = useState("");
  const [description, setDescription] = useState("");
  const [properties, setProperties] = useState([]);

  const [loading, setLoading] = useState(false);
  const { performActions, address } = useContractKit();
  const gemContract = useGemContract();
  const navigate = useNavigate();

  // check if all form data has been filled
  const isFormFilled = () =>
    name && ipfsImage && description && properties.length > 2;

  // close the popup modal
  const handleClose = () => {
    setProperties([]);
    navigate("/");
  };

  // add an attribute to an NFT
  const handleSetProperties = (e, trait_type) => {
    const { value } = e.target;
    const attributeObject = {
      trait_type,
      value,
    };
    const arr = properties;

    // check if attribute already exists
    const index = arr.findIndex((el) => el.trait_type === trait_type);

    if (index >= 0) {
      // update the existing attribute
      arr[index] = {
        trait_type,
        value,
      };
      setProperties(arr);
      return;
    }

    // add a new attribute
    setProperties((oldArray) => [...oldArray, attributeObject]);
  };

  // mint new NFT
  const mint = async (data) => {
    try {
      setLoading(true);
      // create an nft functionality
      await createNft(gemContract, performActions, data);
      toast(<NotificationSuccess text="Updating NFT list...." />);
      // getAssets()
      navigate("/");
    } catch (error) {
      console.log({ error });
      toast(<NotificationError text="Failed to create an NFT." />);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Modal */}
      <Modal show={true} centered>
        <Modal.Header>
          <Modal.Title>Mint new GEM</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            <FloatingLabel
              controlId="inputLocation"
              label="Name"
              className="mb-3"
            >
              <Form.Control
                type="text"
                placeholder="Name of GEM"
                onChange={(e) => {
                  setName(e.target.value);
                }}
              />
            </FloatingLabel>

            <FloatingLabel
              controlId="inputLocation"
              label="Value (in coins)"
              className="mb-3"
            >
              <Form.Control
                type="number"
                placeholder="Value (how many coins is it worth?)"
                onChange={(e) => {
                  setGemValue(new BigNumber(e.target.value).toString());
                }}
              />
            </FloatingLabel>

            <FloatingLabel
              controlId="inputDescription"
              label="Gem description"
              className="mb-3"
            >
              <Form.Control
                as="textarea"
                placeholder="description"
                style={{ height: "80px" }}
                onChange={(e) => {
                  setDescription(e.target.value);
                }}
              />
            </FloatingLabel>

            <Form.Control
              type="file"
              className={"mb-3"}
              onChange={async (e) => {
                const imageUrl = await uploadToIpfs(e);
                if (!imageUrl) {
                  alert("failed to upload image");
                  return;
                }
                setIpfsImage(imageUrl);
              }}
              placeholder="GEM Image"
            ></Form.Control>

            <Form.Label>
              <h5>GEM Properties</h5>
            </Form.Label>

            <FloatingLabel
              controlId="inputLocation"
              label="Color"
              className="mb-3"
            >
              <Form.Control
                type="text"
                placeholder="Color of GEM"
                onChange={(e) => {
                  handleSetProperties(e, "color");
                }}
              />
            </FloatingLabel>

            <FloatingLabel
              controlId="inputLocation"
              label="Hardness (in lbs)"
              className="mb-3"
            >
              <Form.Control
                type="number"
                placeholder="Hardness of GEM"
                onChange={(e) => {
                  handleSetProperties(e, "hardness");
                }}
              />
            </FloatingLabel>

            <FloatingLabel
              controlId="inputLocation"
              label="Source"
              className="mb-3"
            >
              <Form.Control
                type="text"
                placeholder="Source of supply"
                onChange={(e) => {
                  handleSetProperties(e, "source");
                }}
              />
            </FloatingLabel>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          {/* <Link to="/"> */}
            <Button variant="outline-secondary" onClick={handleClose}>
              Cancel
            </Button>
          {/* </Link> */}
          <Button
            variant="dark"
            disabled={!isFormFilled()}
            onClick={() => {
              mint({
                name,
                gemValue,
                ipfsImage,
                description,
                properties: properties,
              });
              handleClose();
            }}
          >
            Mint
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default MintNFT;
