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
 * LANDING CONFIG - SERVICIOS PÚBLICOS
 ************/

export const getLandingConfigPublic = () => {
  const controller = loadAbort();

  return {
    call: axios
      .get(`${baseUrl}/landing/public`, {
        signal: controller.signal,
      })
      .catch((error) => {
        notifyError(error);
        throw error;
      }),
    controller,
  };
};

export const getMaintenanceStatus = () => {
  const controller = loadAbort();

  return {
    call: axios
      .get(`${baseUrl}/landing/maintenance-status`, {
        signal: controller.signal,
      })
      .catch((error) => {
        notifyError(error);
        throw error;
      }),
    controller,
  };
};

export const checkCurrentIP = () => {
  const controller = loadAbort();

  return {
    call: axios
      .get(`${baseUrl}/landing/check-ip`, {
        signal: controller.signal,
      })
      .catch((error) => {
        notifyError(error);
        throw error;
      }),
    controller,
  };
};

/**********
 * LANDING CONFIG - SERVICIOS ADMINISTRATIVOS
 ************/

export const getLandingConfigAdmin = () => {
  const controller = loadAbort();
  const headers = getAxiosHeaders();

  if (!headers) {
    return;
  }

  return {
    call: axios
      .get(`${baseUrl}/landing/admin`, {
        ...headers,
        signal: controller.signal,
      })
      .catch((error) => {
        notifyError(error);
        throw error;
      }),
    controller,
  };
};

export const updateLandingConfig = (configData) => {
  const controller = loadAbort();
  const headers = getAxiosHeaders();

  if (!headers) {
    return;
  }

  // Mapear la configuración del frontend al formato que espera el backend
  const backendData = {
    siteName: configData.siteName,
    tagline: configData.tagline,
    description: configData.description,
    logo: configData.logo,
    favicon: configData.favicon,
    seoTitle: configData.seoTitle,
    seoDescription: configData.seoDescription,
    seoKeywords: configData.seoKeywords,
    ogImage: configData.ogImage,
    canonicalUrl: configData.canonicalUrl,
    primaryColor: configData.primaryColor,
    secondaryColor: configData.secondaryColor,
    accentColor: configData.accentColor,
    backgroundColor: configData.backgroundColor,
    textColor: configData.textColor,
    fontFamily: configData.fontFamily,
    fontSize: configData.fontSize,
    borderRadius: configData.borderRadius,
    maintenanceMode: configData.maintenanceMode,
    maintenanceMessage: configData.maintenanceMessage,
    maintenanceAllowedIPs: configData.maintenanceAllowedIPs || [],
  };

  return {
    call: axios
      .put(`${baseUrl}/landing/admin`, backendData, {
        ...headers,
        signal: controller.signal,
      })
      .catch((error) => {
        notifyError(error);
        throw error;
      }),
    controller,
  };
};

export const resetLandingConfig = () => {
  const controller = loadAbort();
  const headers = getAxiosHeaders();

  if (!headers) {
    return;
  }

  return {
    call: axios
      .post(
        `${baseUrl}/landing/admin/reset`,
        {},
        {
          ...headers,
          signal: controller.signal,
        }
      )
      .catch((error) => {
        notifyError(error);
        throw error;
      }),
    controller,
  };
};

export const exportLandingConfig = () => {
  const controller = loadAbort();
  const headers = getAxiosHeaders();

  if (!headers) {
    return;
  }

  return {
    call: axios
      .get(`${baseUrl}/landing/admin/export`, {
        ...headers,
        responseType: "blob",
        signal: controller.signal,
      })
      .then((response) => {
        // Crear blob y descargar
        const blob = new Blob([response.data], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;

        // Generar nombre con fecha
        const date = new Date().toISOString().split("T")[0];
        link.download = `landing-config-${date}.json`;

        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        return response;
      })
      .catch((error) => {
        notifyError(error);
        throw error;
      }),
    controller,
  };
};

export const importLandingConfig = (configData) => {
  const controller = loadAbort();
  const headers = getAxiosHeaders();

  if (!headers) {
    return;
  }

  return {
    call: axios
      .post(`${baseUrl}/landing/admin/import`, configData, {
        ...headers,
        signal: controller.signal,
      })
      .catch((error) => {
        notifyError(error);
        throw error;
      }),
    controller,
  };
};

/**********
 * UTILIDADES
 ************/

export const validateConfigFile = (fileContent) => {
  try {
    const config = JSON.parse(fileContent);

    // Validaciones básicas
    const requiredFields = ["siteName"];
    const missingFields = requiredFields.filter((field) => !config[field]);

    if (missingFields.length > 0) {
      return {
        valid: false,
        error: `Campos requeridos faltantes: ${missingFields.join(", ")}`,
      };
    }

    // Validar colores si están presentes
    const colorFields = [
      "primaryColor",
      "secondaryColor",
      "accentColor",
      "backgroundColor",
      "textColor",
    ];
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

    for (const field of colorFields) {
      if (config[field] && !colorRegex.test(config[field])) {
        return {
          valid: false,
          error: `Color inválido en ${field}: ${config[field]}`,
        };
      }
    }

    return {
      valid: true,
      config,
    };
  } catch (error) {
    return {
      valid: false,
      error: "Archivo JSON inválido",
    };
  }
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
