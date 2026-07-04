import { Suspense, lazy, useEffect, useRef, useState } from 'react';

// three.js, @react-three/drei et les loaders pèsent plusieurs Mo : on ne les
// charge (chunk séparé) que lorsque le viewer approche du viewport, pour que
// la page s'affiche sans attendre la pile 3D.
const Model3DCanvas = lazy(() => import('./Model3DCanvas'));

export default function Model3D(props) {
  const containerRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const el = containerRef.current;
    if (!el) return;

    if (!('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div ref={containerRef} style={{ height: '300px', width: '100%', marginBottom: '1rem' }}>
      {visible && (
        <Suspense fallback={null}>
          <Model3DCanvas {...props} />
        </Suspense>
      )}
    </div>
  );
}
