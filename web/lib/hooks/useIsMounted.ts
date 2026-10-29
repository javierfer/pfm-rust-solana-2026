import { useEffect, useState } from "react";

/**
 * Hook that prevents hydration mismatch by waiting until the client is mounted
 */
export function useIsMounted() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
}
