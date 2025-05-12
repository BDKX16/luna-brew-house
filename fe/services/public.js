import { loadAbort } from "../utils/load-abort-controller";
import axios from "axios";
import store from "../redux/store";
//import { useSelector } from "react-redux";

import { enqueueSnackbar } from "notistack";

const getAxiosHeaders = () => {
  //const userState = useSelector((store) => store.user);
  const state = store.getState();
  if (!state.user.token) {
    return;
  }
  return {
    headers: {
      token: state.user.token,
      "Content-Type": "application/json",
    },
  };
};

// Autenticación
export const login = (username, password) => {
  const controller = loadAbort();
  return {
    call: axios
      .post(
        import.meta.env.VITE_BASE_URL + "/login",
        { email: username, password },
        { signal: controller.signal }
      )
      .catch((error) => {
        notifyError(error);
      }),
    controller,
  };
};

export const register = (name, username, password) => {
  const controller = loadAbort();
  return {
    call: axios
      .post(
        import.meta.env.VITE_BASE_URL + "/register",
        { name: name, email: username, password: password },
        { signal: controller.signal }
      )
      .catch((error) => {
        notifyError(error);
      }),
    controller,
  };
};

// Productos - Cervezas
export const getBeers = () => {
  const controller = loadAbort();
  return {
    call: axios
      .get(import.meta.env.VITE_BASE_URL + "/beers", {
        signal: controller.signal,
      })
      .catch((error) => {
        notifyError(error);
      }),
    controller,
  };
};

export const getBeerById = (beerId) => {
  const controller = loadAbort();
  return {
    call: axios
      .get(import.meta.env.VITE_BASE_URL + `/beers/${beerId}`, {
        signal: controller.signal,
      })
      .catch((error) => {
        notifyError(error);
      }),
    controller,
  };
};

// Productos - Suscripciones
export const getSubscriptionPlans = () => {
  const controller = loadAbort();
  return {
    call: axios
      .get(import.meta.env.VITE_BASE_URL + "/subscriptions", {
        signal: controller.signal,
      })
      .catch((error) => {
        notifyError(error);
      }),
    controller,
  };
};

export const getSubscriptionPlanById = (planId) => {
  const controller = loadAbort();
  return {
    call: axios
      .get(import.meta.env.VITE_BASE_URL + `/subscriptions/${planId}`, {
        signal: controller.signal,
      })
      .catch((error) => {
        notifyError(error);
      }),
    controller,
  };
};

export const getFeaturedSubscriptions = () => {
  const controller = loadAbort();
  return {
    call: axios
      .get(import.meta.env.VITE_BASE_URL + "/featured-subscriptions", {
        signal: controller.signal,
      })
      .catch((error) => {
        notifyError(error);
      }),
    controller,
  };
};

// Descuentos
export const validateDiscount = (code, cartItems) => {
  const controller = loadAbort();
  return {
    call: axios
      .post(
        import.meta.env.VITE_BASE_URL + "/validate-discount",
        { code, cartItems },
        { signal: controller.signal }
      )
      .catch((error) => {
        notifyError(error);
      }),
    controller,
  };
};

// Suscripciones de usuario (requiere autenticación)
export const getUserSubscriptions = () => {
  const controller = loadAbort();
  const headers = getAxiosHeaders();

  if (!headers) {
    return {
      call: Promise.reject(new Error("No hay token de autenticación")),
      controller,
    };
  }

  return {
    call: axios
      .get(import.meta.env.VITE_BASE_URL + "/my-subscriptions", headers, {
        signal: controller.signal,
      })
      .catch((error) => {
        notifyError(error);
      }),
    controller,
  };
};

export const getUserSubscriptionById = (subscriptionId) => {
  const controller = loadAbort();
  const headers = getAxiosHeaders();

  if (!headers) {
    return {
      call: Promise.reject(new Error("No hay token de autenticación")),
      controller,
    };
  }

  return {
    call: axios
      .get(
        import.meta.env.VITE_BASE_URL + `/my-subscriptions/${subscriptionId}`,
        headers,
        {
          signal: controller.signal,
        }
      )
      .catch((error) => {
        notifyError(error);
      }),
    controller,
  };
};

export const updateSubscriptionStatus = (subscriptionId, status) => {
  const controller = loadAbort();
  const headers = getAxiosHeaders();

  if (!headers) {
    return {
      call: Promise.reject(new Error("No hay token de autenticación")),
      controller,
    };
  }

  return {
    call: axios
      .patch(
        import.meta.env.VITE_BASE_URL +
          `/my-subscriptions/${subscriptionId}/status`,
        { status },
        headers,
        { signal: controller.signal }
      )
      .catch((error) => {
        notifyError(error);
      }),
    controller,
  };
};

export const cancelUserSubscription = (subscriptionId, reason) => {
  const controller = loadAbort();
  const headers = getAxiosHeaders();

  if (!headers) {
    return {
      call: Promise.reject(new Error("No hay token de autenticación")),
      controller,
    };
  }

  return {
    call: axios
      .patch(
        import.meta.env.VITE_BASE_URL +
          `/my-subscriptions/${subscriptionId}/cancel`,
        { reason },
        headers,
        { signal: controller.signal }
      )
      .catch((error) => {
        notifyError(error);
      }),
    controller,
  };
};

export const updateSubscriptionBeerType = (
  subscriptionId,
  beerType,
  beerName
) => {
  const controller = loadAbort();
  const headers = getAxiosHeaders();

  if (!headers) {
    return {
      call: Promise.reject(new Error("No hay token de autenticación")),
      controller,
    };
  }

  return {
    call: axios
      .patch(
        import.meta.env.VITE_BASE_URL +
          `/my-subscriptions/${subscriptionId}/beer-type`,
        { beerType, beerName },
        headers,
        { signal: controller.signal }
      )
      .catch((error) => {
        notifyError(error);
      }),
    controller,
  };
};

export const createSubscription = (subscriptionId, beerType, beerName) => {
  const controller = loadAbort();
  const headers = getAxiosHeaders();

  if (!headers) {
    return {
      call: Promise.reject(new Error("No hay token de autenticación")),
      controller,
    };
  }

  return {
    call: axios
      .post(
        import.meta.env.VITE_BASE_URL + `/subscriptions`,
        { subscriptionId, beerType, beerName },
        headers,
        { signal: controller.signal }
      )
      .catch((error) => {
        notifyError(error);
      }),
    controller,
  };
};

// Recomendaciones (requiere autenticación)
export const getTopProducts = () => {
  const controller = loadAbort();
  const headers = getAxiosHeaders();

  if (!headers) {
    return {
      call: Promise.reject(new Error("No hay token de autenticación")),
      controller,
    };
  }

  return {
    call: axios
      .get(import.meta.env.VITE_BASE_URL + "/top-products", headers, {
        signal: controller.signal,
      })
      .catch((error) => {
        notifyError(error);
      }),
    controller,
  };
};

/**********
 * FUNCTIONS
 ************/

const notifyError = (error) => {
  if (error.status === 401) {
    enqueueSnackbar("No autorizado", {
      variant: "error",
    });
  } else if (error.status !== 200) {
    enqueueSnackbar(error.response.data.error.message, {
      variant: "error",
    });
  }
};
