import { useState, useEffect, useCallback, useRef } from "react";

const useFetchAndLoad = () => {
  const [loading, setLoading] = useState(false);
  const controllerRef = useRef();

  const callEndpoint = useCallback(async (axiosCall) => {
    if (!axiosCall) return;

    if (axiosCall.controller) {
      controllerRef.current = axiosCall.controller;
    }

    setLoading(true);
    let result = {};
    try {
      result = await axiosCall.call;
    } catch (error) {
      // Solo loggear errores que no sean de cancelación
      if (error.name !== "CanceledError" && error.name !== "AbortError") {
        console.error("Fetch error:", error);
      }
    }
    setLoading(false);
    return result;
  }, []);

  const cancelEndpoint = useCallback(() => {
    setLoading(false);
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
  }, []);

  useEffect(() => {
    return () => {
      cancelEndpoint();
    };
  }, [cancelEndpoint]);

  return { loading, callEndpoint };
};

export default useFetchAndLoad;
