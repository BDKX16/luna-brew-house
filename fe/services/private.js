import { loadAbort } from "@/utils/load-abort-controller";
import axios from "axios";
import { store } from "../redux/store";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const getAxiosHeaders = () => {
  const state = store.getState();
  if (!state.user.token) {
    return null;
  }
  return {
    headers: {
      token: state.user.token,
      "Content-Type": "application/json",
    },
  };
};

/**********
 * CONTENT
 ************/

export const addContent = (data) => {
  const controller = loadAbort();

  const headers = getAxiosHeaders();
  if (!headers) {
    return;
  }
  return {
    call: axios
      .post(process.env.NEXT_PUBLIC_API_URL + "/admin/content", data, headers, {
        signal: controller.signal,
      })
      .catch((error) => {
        notifyError(error);
      }),
    controller,
  };
};

/**********
 * GESTIÓN DE PRODUCTOS - CERVEZAS
 ************/

// Obtener todas las cervezas
export const getAdminBeers = () => {
  const controller = loadAbort();
  const headers = getAxiosHeaders();

  if (!headers) {
    return;
  }

  return {
    call: axios
      .get(process.env.NEXT_PUBLIC_API_URL + "/admin/beers", headers, {
        signal: controller.signal,
      })
      .catch((error) => {
        notifyError(error);
      }),
    controller,
  };
};

// Obtener una cerveza por ID
export const getAdminBeerById = (beerId) => {
  const controller = loadAbort();
  const headers = getAxiosHeaders();

  if (!headers) {
    return;
  }

  return {
    call: axios
      .get(
        process.env.NEXT_PUBLIC_API_URL + `/admin/beers/${beerId}`,
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

// Crear una nueva cerveza
export const createBeer = (beerData) => {
  const controller = loadAbort();
  const headers = getAxiosHeaders();

  if (!headers) {
    return;
  }

  return {
    call: axios
      .post(
        process.env.NEXT_PUBLIC_API_URL + "/admin/beers",
        beerData,
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

// Actualizar una cerveza
export const updateBeer = (beerId, beerData) => {
  const controller = loadAbort();
  const headers = getAxiosHeaders();

  if (!headers) {
    return;
  }

  return {
    call: axios
      .put(
        process.env.NEXT_PUBLIC_API_URL + `/admin/beers/${beerId}`,
        beerData,
        headers,
        { signal: controller.signal }
      )
      .catch((error) => {
        notifyError(error);
      }),
    controller,
  };
};

// Eliminar una cerveza
export const deleteBeer = (beerId) => {
  const controller = loadAbort();
  const headers = getAxiosHeaders();

  if (!headers) {
    return;
  }

  return {
    call: axios
      .delete(
        process.env.NEXT_PUBLIC_API_URL + `/admin/beers/${beerId}`,
        headers,
        { signal: controller.signal }
      )
      .catch((error) => {
        notifyError(error);
      }),
    controller,
  };
};

/**********
 * GESTIÓN DE PRODUCTOS - SUSCRIPCIONES
 ************/

// Obtener todos los planes de suscripción (Para el panel de administración)
export const getAdminSubscriptionPlans = () => {
  const controller = loadAbort();
  const headers = getAxiosHeaders();

  if (!headers) {
    return;
  }
  return {
    call: axios
      .get(
        process.env.NEXT_PUBLIC_API_URL + "/admin/subscription-plans",
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

// Obtener un plan de suscripción por ID
export const getAdminSubscriptionPlanById = (planId) => {
  const controller = loadAbort();
  const headers = getAxiosHeaders();

  if (!headers) {
    return;
  }

  return {
    call: axios
      .get(
        process.env.NEXT_PUBLIC_API_URL + `/admin/subscription-plan/${planId}`,
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

// Crear un nuevo plan de suscripción
export const createSubscriptionPlan = (planData) => {
  const controller = loadAbort();
  const headers = getAxiosHeaders();

  if (!headers) {
    return;
  }

  return {
    call: axios
      .post(
        process.env.NEXT_PUBLIC_API_URL + "/admin/subscriptions",
        planData,
        headers,
        { signal: controller.signal }
      )
      .catch((error) => {
        notifyError(error);
      }),
    controller,
  };
};

// Actualizar un plan de suscripción
export const updateSubscriptionPlan = (planId, planData) => {
  const controller = loadAbort();
  const headers = getAxiosHeaders();

  if (!headers) {
    return;
  }

  return {
    call: axios
      .put(
        process.env.NEXT_PUBLIC_API_URL + `/admin/subscriptions/${planId}`,
        planData,
        headers,
        { signal: controller.signal }
      )
      .catch((error) => {
        notifyError(error);
      }),
    controller,
  };
};

// Eliminar un plan de suscripción
export const deleteSubscriptionPlan = (planId) => {
  const controller = loadAbort();
  const headers = getAxiosHeaders();

  if (!headers) {
    return;
  }

  return {
    call: axios
      .delete(
        process.env.NEXT_PUBLIC_API_URL + `/admin/subscriptions/${planId}`,
        headers,
        { signal: controller.signal }
      )
      .catch((error) => {
        notifyError(error);
      }),
    controller,
  };
};

/**********
 * GESTIÓN DE DESCUENTOS
 ************/

// Obtener todos los descuentos
export const getAdminDiscounts = () => {
  const controller = loadAbort();
  const headers = getAxiosHeaders();

  if (!headers) {
    return;
  }

  return {
    call: axios
      .get(process.env.NEXT_PUBLIC_API_URL + "/admin/discounts", headers, {
        signal: controller.signal,
      })
      .catch((error) => {
        notifyError(error);
      }),
    controller,
  };
};

// Obtener un descuento por ID
export const getAdminDiscountById = (discountId) => {
  const controller = loadAbort();
  const headers = getAxiosHeaders();

  if (!headers) {
    return;
  }

  return {
    call: axios
      .get(
        process.env.NEXT_PUBLIC_API_URL + `/admin/discounts/${discountId}`,
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

// Crear un nuevo descuento
export const createDiscount = (discountData) => {
  const controller = loadAbort();
  const headers = getAxiosHeaders();

  if (!headers) {
    return;
  }

  return {
    call: axios
      .post(
        process.env.NEXT_PUBLIC_API_URL + "/admin/discounts",
        discountData,
        headers,
        { signal: controller.signal }
      )
      .catch((error) => {
        notifyError(error);
      }),
    controller,
  };
};

// Actualizar un descuento
export const updateDiscount = (discountId, discountData) => {
  const controller = loadAbort();
  const headers = getAxiosHeaders();

  if (!headers) {
    return;
  }

  return {
    call: axios
      .put(
        process.env.NEXT_PUBLIC_API_URL + `/admin/discounts/${discountId}`,
        discountData,
        headers,
        { signal: controller.signal }
      )
      .catch((error) => {
        notifyError(error);
      }),
    controller,
  };
};

// Eliminar un descuento
export const deleteDiscount = (discountId) => {
  const controller = loadAbort();
  const headers = getAxiosHeaders();

  if (!headers) {
    return;
  }

  return {
    call: axios
      .delete(
        process.env.NEXT_PUBLIC_API_URL + `/admin/discounts/${discountId}`,
        headers,
        { signal: controller.signal }
      )
      .catch((error) => {
        notifyError(error);
      }),
    controller,
  };
};

// Activar/desactivar un descuento
export const toggleDiscount = (discountId) => {
  const controller = loadAbort();
  const headers = getAxiosHeaders();

  if (!headers) {
    return;
  }

  return {
    call: axios
      .patch(
        process.env.NEXT_PUBLIC_API_URL +
          `/admin/discounts/${discountId}/toggle`,
        {},
        headers,
        { signal: controller.signal }
      )
      .catch((error) => {
        notifyError(error);
      }),
    controller,
  };
};

/**********
 * GESTIÓN DE ÓRDENES/VENTAS
 ************/

// Obtener todas las órdenes con filtros
export const getAdminOrders = (filters = {}) => {
  const controller = loadAbort();
  const headers = getAxiosHeaders();

  if (!headers) {
    return;
  }

  // Convertir los filtros a parámetros de consulta
  const queryParams = new URLSearchParams();
  if (filters.status) queryParams.append("status", filters.status);
  if (filters.startDate) queryParams.append("startDate", filters.startDate);
  if (filters.endDate) queryParams.append("endDate", filters.endDate);
  if (filters.limit) queryParams.append("limit", filters.limit);
  if (filters.page) queryParams.append("page", filters.page);

  const queryString = queryParams.toString()
    ? `?${queryParams.toString()}`
    : "";

  return {
    call: axios
      .get(
        process.env.NEXT_PUBLIC_API_URL + `/admin/orders${queryString}`,
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

// Obtener una orden específica
export const getAdminOrderById = (orderId) => {
  const controller = loadAbort();
  const headers = getAxiosHeaders();

  if (!headers) {
    return;
  }

  return {
    call: axios
      .get(
        process.env.NEXT_PUBLIC_API_URL + `/admin/orders/${orderId}`,
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

// Actualizar el estado de una orden
export const updateOrderStatus = (orderId, status) => {
  const controller = loadAbort();
  const headers = getAxiosHeaders();

  if (!headers) {
    return;
  }

  return {
    call: axios
      .patch(
        process.env.NEXT_PUBLIC_API_URL + `/admin/orders/${orderId}/status`,
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

// Actualizar los datos de entrega de una orden
export const updateOrderDelivery = (orderId, deliveryTime) => {
  const controller = loadAbort();
  const headers = getAxiosHeaders();

  if (!headers) {
    return;
  }

  return {
    call: axios
      .patch(
        process.env.NEXT_PUBLIC_API_URL + `/admin/orders/${orderId}/delivery`,
        { deliveryTime },
        headers,
        { signal: controller.signal }
      )
      .catch((error) => {
        notifyError(error);
      }),
    controller,
  };
};

// Cancelar una orden
export const cancelOrder = (orderId, cancellationReason) => {
  const controller = loadAbort();
  const headers = getAxiosHeaders();

  if (!headers) {
    return;
  }

  return {
    call: axios
      .patch(
        process.env.NEXT_PUBLIC_API_URL + `/admin/orders/${orderId}/cancel`,
        { cancellationReason },
        headers,
        { signal: controller.signal }
      )
      .catch((error) => {
        notifyError(error);
      }),
    controller,
  };
};

// Obtener estadísticas de ventas
export const getAdminOrderStats = (period = "month") => {
  const controller = loadAbort();
  const headers = getAxiosHeaders();

  if (!headers) {
    return;
  }

  return {
    call: axios
      .get(
        process.env.NEXT_PUBLIC_API_URL + `/admin/stats?period=${period}`,
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

/**********
 * GESTIÓN DE SUSCRIPCIONES DE USUARIOS
 ************/

// Obtener todas las suscripciones de usuarios
export const getAdminUserSubscriptions = (filters = {}) => {
  const controller = loadAbort();
  const headers = getAxiosHeaders();

  if (!headers) {
    return;
  }

  // Convertir los filtros a parámetros de consulta
  const queryParams = new URLSearchParams();
  if (filters.status) queryParams.append("status", filters.status);
  if (filters.userId) queryParams.append("userId", filters.userId);
  if (filters.limit) queryParams.append("limit", filters.limit);
  if (filters.page) queryParams.append("page", filters.page);

  const queryString = queryParams.toString()
    ? `?${queryParams.toString()}`
    : "";

  return {
    call: axios
      .get(
        process.env.NEXT_PUBLIC_API_URL + `/admin/subscriptions${queryString}`,
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

// Obtener una suscripción específica
export const getAdminUserSubscriptionById = (subscriptionId) => {
  const controller = loadAbort();
  const headers = getAxiosHeaders();

  if (!headers) {
    return;
  }

  return {
    call: axios
      .get(
        process.env.NEXT_PUBLIC_API_URL +
          `/admin/subscriptions/${subscriptionId}`,
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

// Actualizar estado de suscripción
export const updateAdminSubscriptionStatus = (
  subscriptionId,
  status,
  reason
) => {
  const controller = loadAbort();
  const headers = getAxiosHeaders();

  if (!headers) {
    return;
  }

  return {
    call: axios
      .patch(
        process.env.NEXT_PUBLIC_API_URL +
          `/admin/subscriptions/${subscriptionId}/status`,
        { status, reason },
        headers,
        { signal: controller.signal }
      )
      .catch((error) => {
        notifyError(error);
      }),
    controller,
  };
};

// Registrar una nueva entrega en una suscripción
export const addSubscriptionDelivery = (subscriptionId, deliveryData) => {
  const controller = loadAbort();
  const headers = getAxiosHeaders();

  if (!headers) {
    return;
  }

  return {
    call: axios
      .post(
        process.env.NEXT_PUBLIC_API_URL +
          `/admin/subscriptions/${subscriptionId}/deliveries`,
        deliveryData,
        headers,
        { signal: controller.signal }
      )
      .catch((error) => {
        notifyError(error);
      }),
    controller,
  };
};

// Actualizar el estado de una entrega
export const updateDeliveryStatus = (subscriptionId, deliveryIndex, status) => {
  const controller = loadAbort();
  const headers = getAxiosHeaders();

  if (!headers) {
    return;
  }

  return {
    call: axios
      .patch(
        process.env.NEXT_PUBLIC_API_URL +
          `/admin/subscriptions/${subscriptionId}/deliveries/${deliveryIndex}`,
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

// Obtener estadísticas de suscripciones
export const getSubscriptionStats = () => {
  const controller = loadAbort();
  const headers = getAxiosHeaders();

  if (!headers) {
    return;
  }

  return {
    call: axios
      .get(
        process.env.NEXT_PUBLIC_API_URL + `/admin/subscriptions/stats`,
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

/**********
 * Dashboard Analytics
 ************/

export const getDashboardStats = () => {
  const controller = loadAbort();

  const headers = getAxiosHeaders();

  if (!headers) {
    return;
  }

  return {
    call: axios
      .get(`${baseUrl}/admin/dashboard`, headers, {
        signal: controller.signal,
      })
      .catch((error) => {
        notifyError(error);
      }),
    controller,
  };
};

export const getTopProducts = (limit = 5) => {
  const controller = loadAbort();

  const headers = getAxiosHeaders();

  if (!headers) {
    return;
  }
  return {
    call: axios
      .get(`${baseUrl}/admin/dashboard/top-products?limit=${limit}`, headers, {
        signal: controller.signal,
      })
      .catch((error) => {
        notifyError(error);
      }),
    controller,
  };
};

export const getRecentOrders = (limit = 5) => {
  const controller = loadAbort();
  const headers = getAxiosHeaders();

  if (!headers) {
    return;
  }
  return {
    call: axios
      .get(`${baseUrl}/admin/dashboard/recent-orders?limit=${limit}`, headers, {
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
    // enqueueSnackbar("No autorizado", {
    //   variant: "error",
    // });
    window.location.href = "/login";
  } else if (error.status !== 200) {
    // enqueueSnackbar(
    //   error.response?.data?.error?.message || "Error desconocido",
    //   {
    //     variant: "error",
    //   }
    // );
  }
};
