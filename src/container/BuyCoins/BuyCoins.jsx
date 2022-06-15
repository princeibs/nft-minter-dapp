import { useContractKit } from "@celo-tools/use-contractkit";
import BigNumber from "bignumber.js";
import React, { useState } from "react";
import { Form, Modal, Button } from "react-bootstrap";
import { useNavigate } from "react-router";
import { useGemContract } from "../../hooks";

import { ERC20_DECIMALS } from "../../utils/constants";

const BuyPoints = () => {
  const [amount, setAmount] = useState(100);
  const [value, setValue] = useState(amount / 10);
  const navigate = useNavigate();
  const gemContract = useGemContract();
  const { kit } = useContractKit();
  const { defaultAccount } = kit;

  const handleClose = () => {
    setAmount(10);
    navigate("/");
  };

  const handleProceed = async () => {
    const cost = new BigNumber(value).shiftedBy(ERC20_DECIMALS).toString();
    const txn = await gemContract.methods
      .buyPoints(amount)
      .send({ from: defaultAccount, value: cost });
  };
  navigate("/");

  return (
    <>
      <Modal show={true}>
        <Modal.Header closeButton>
          <Modal.Title>Buy Coins</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
              <Form.Label>How many coins do you want to buy?</Form.Label>
              <Form.Control
                type="number"
                placeholder="100"
                autoFocus
                onChange={(e) => {
                  setAmount(e.target.value);
                  setValue(e.target.value / 10);
                }}
              />
            </Form.Group>
            <Form.Group
              className="mb-3"
              controlId="exampleForm.ControlTextarea1"
            >
              <Form.Label>Cost</Form.Label>
              <Form.Control
                disabled
                value={amount / 10}
                type="text"
                placeholder="10 CELO"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancle
          </Button>
          <Button variant="primary" onClick={handleProceed}>
            Proceed
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default BuyPoints;
