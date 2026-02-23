import React from 'react';
import Model3D from './Model3D';

const ProductCard = ({ title, description, model3DProps }) => {
  return (
    <div className="card h-100 project-card">
      <div className="card-body text-center">
        <Model3D {...model3DProps} />
        <h5 className="card-title">{title}</h5>
        <p className="card-text">{description}</p>
      </div>
    </div>
  );
};

export default ProductCard;
