import React from 'react';
import './Loader.css'; // update with the correct path to your image

const Loader = () => {
  return (
    <div className="loader-container z-9999">
      <img src="" alt="&nbsp;&nbsp;&nbsp;&nbsp;GenAnime" className="loader-image" />
      <p className="loader-text ">Created By <span className='font-bold'>DARKXSIDE78</span></p>
      <div className="loader-bar">
        <div className="loader-progress"></div>
      </div>
    </div>
  );
}

export default Loader;
