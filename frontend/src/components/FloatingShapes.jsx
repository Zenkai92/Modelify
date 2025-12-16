import React from 'react';

const FloatingShapes = () => {
  return (
    <>
      {/* Définition du gradient pour les SVG */}
      <svg style={{ width: 0, height: 0, position: 'absolute' }} aria-hidden="true" focusable="false">
        <linearGradient id="gradient-fill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#667eea" />
          <stop offset="100%" stopColor="#764ba2" />
        </linearGradient>
      </svg>

      <div className="floating-shapes-container">
        {/* Cube blanc (dans le hero) */}
        <svg className="floating-shape shape-white shape-1" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12.6,2L8.4,4.1l-4.2,2.1l0,0L4,6.3v8.4l0,0l0.2,0.1l4.2,2.1l4.2,2.1l4.2-2.1l4.2-2.1V6.3L12.6,2z M12.6,16.8 L8.4,14.7V10.5l4.2,2.1L12.6,16.8z M12.6,11.6L8.4,9.5l4.2-2.1l4.2,2.1L12.6,11.6z M16.8,14.7l-4.2,2.1v-4.2l4.2-2.1V14.7z"/>
        </svg>
        
        {/* Polygone blanc (dans le hero) */}
        <svg className="floating-shape shape-white shape-2" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12,2L2,7l10,5l10-5L12,2z M2,17l10,5l10-5l-10-5L2,17z"/>
        </svg>

        {/* Cube Gradient (transition vers services) */}
        <svg className="floating-shape shape-gradient shape-3" viewBox="0 0 24 24">
          <path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18-.21 0-.41-.06-.57-.18l-7.9-4.44A.991.991 0 0 1 3 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18.21 0 .41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9zM12 4.15L6.04 7.5 12 10.85l5.96-3.35L12 4.15zM5 15.91l6 3.38v-6.71L5 9.21v6.7z" />
        </svg>

        {/* Sphère/Cercle Gradient (transition vers services) */}
        <svg className="floating-shape shape-gradient shape-4" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
        </svg>

        {/* Losange blanc (remplace prisme) */}
        <svg className="floating-shape shape-white shape-5" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12,2 L22,12 L12,22 L2,12 Z"/>
        </svg>

        {/* Anneau blanc (remplace triangle haut) */}
        <svg className="floating-shape shape-white shape-6" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12,2 C6.48,2 2,6.48 2,12 C2,17.52 6.48,22 12,22 C17.52,22 22,17.52 22,12 C22,6.48 17.52,2 12,2 Z M12,18 C8.69,18 6,15.31 6,12 C6,8.69 8.69,6 12,6 C15.31,6 18,8.69 18,12 C18,15.31 15.31,18 12,18 Z"/>
        </svg>

        {/* Cube Gradient (bas gauche) */}
        <svg className="floating-shape shape-gradient shape-cube-left" viewBox="0 0 24 24">
          <path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18-.21 0-.41-.06-.57-.18l-7.9-4.44A.991.991 0 0 1 3 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18.21 0 .41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9z" />
        </svg>

        {/* Petit Cube blanc (haut centre) */}
        <svg className="floating-shape shape-white shape-cube-small" viewBox="0 0 24 24">
           <path fill="currentColor" d="M12.6,2L8.4,4.1l-4.2,2.1l0,0L4,6.3v8.4l0,0l0.2,0.1l4.2,2.1l4.2,2.1l4.2-2.1l4.2-2.1V6.3L12.6,2z M12.6,16.8 L8.4,14.7V10.5l4.2,2.1L12.6,16.8z M12.6,11.6L8.4,9.5l4.2-2.1l4.2,2.1L12.6,11.6z M16.8,14.7l-4.2,2.1v-4.2l4.2-2.1V14.7z"/>
        </svg>

        {/* Pyramide Gradient (droite) */}
        <svg className="floating-shape shape-gradient shape-pyramid" viewBox="0 0 24 24">
           <path d="M12,2L2,22h20L12,2z"/>
        </svg>

        {/* Sphère blanche (gauche) */}
        <svg className="floating-shape shape-white shape-sphere-left" viewBox="0 0 24 24">
           <circle cx="12" cy="12" r="10" />
        </svg>

        {/* Croix Gradient (centre bas) */}
        <svg className="floating-shape shape-gradient shape-cross" viewBox="0 0 24 24">
           <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
        </svg>
      </div>
    </>
  );
};

export default FloatingShapes;