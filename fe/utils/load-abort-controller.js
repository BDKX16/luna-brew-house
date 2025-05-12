/**
 * Utility to create an AbortController for fetch/axios requests
 * Allows cancellation of in-flight requests when components unmount
 */

export const loadAbort = () => {
  const controller = new AbortController();
  return controller;
};
