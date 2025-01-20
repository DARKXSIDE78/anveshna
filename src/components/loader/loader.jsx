import React from 'react';
import './Loader.css';
import logo from '../../images/icon.png'; // update with the correct path to your image

const Loader = () => {
  return (
    <div className="loader-container z-9999">
      <img src={logo} alt="Logo" className="loader-image" />
      <p className="loader-text ">Created By <span className='font-bold'>GenAnime</span></p>
      <div className="loader-bar">
        <div className="loader-progress"></div>
      </div>
    </div>
  );
}

export default Loader;
