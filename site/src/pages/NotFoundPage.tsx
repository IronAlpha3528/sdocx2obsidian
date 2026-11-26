import React from "react";
import { Link } from "react-router-dom";

export const NotFoundPage: React.FC = () => {

  return (
    <div className="subpage-container" style={{ padding: "80px 20px", textAlign: "center" }}>
      <h1 className="page-title" style={{ fontSize: "2rem", marginBottom: "8px" }}>
        404 — Page Not Found
      </h1>
      <p className="page-description" style={{ margin: "0 auto 24px" }}>
        The requested page does not exist or has been moved.
      </p>
      <div>
        <Link to="/" className="btn-primary">
          Return to Converter
        </Link>
      </div>
    </div>
  );
};
