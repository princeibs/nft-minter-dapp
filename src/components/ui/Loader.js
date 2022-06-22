import React from "react";
import { Spinner } from "react-bootstrap";

const style = {
  height: "100vh",
  width: "100vw",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "black"
}

const Loader = () => (
  <div className="d-flex justify-content-center" style={style}>
    <Spinner
      animation="grow"
      variant="light"
      role="status"
      className="opacity-100"
    >
      <span className="visually-hidden">Loading...</span>
    </Spinner>
  </div>
);
export default Loader;
