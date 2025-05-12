const express = require("express");
const crypto = require("crypto");
const {
  MercadoPagoConfig,
  Preference,

  Payment,
} = require("mercadopago");

const {
  ApiError,
  CheckoutPaymentIntent,
  Client,
  Environment,
  LogLevel,
  OrdersController,
} = require("@paypal/paypal-server-sdk");

const { checkAuth, checkRole } = require("../middlewares/authentication");
const router = express.Router();

const Payments = require("../models/payment.js");
const Content = require("../models/content.js");

// Set up PayPal credentials

const ppclient = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: process.env.PAYPAL_CLIENT_ID,
    oAuthClientSecret: process.env.PAYPAL_SECRET,
  },
  timeout: 0,
  environment: Environment.Sandbox,
  logging: {
    logLevel: LogLevel.Info,
    logRequest: {
      logBody: true,
    },
    logResponse: {
      logHeaders: true,
    },
  },
});

const supportedPaypalCurrencies = [
  "AUD",
  "BRL",
  "CAD",
  "CNY",
  "CZK",
  "DKK",
  "EUR",
  "HKD",
  "HUF",
  "ILS",
  "JPY",
  "MYR",
  "MXN",
  "TWD",
  "NZD",
  "NOK",
  "PHP",
  "PLN",
  "GBP",
  "SGD",
  "SEK",
  "CHF",
  "THB",
  "USD",
];

const ordersController = new OrdersController(ppclient);

// Set up MercadoPago credentials
const client = new MercadoPagoConfig({
  accessToken:
    process.env.MERCADOPAGO_ACCESS_TOKEN ||
    "TEST-4044483755982456-090411-5db8f54f0db2a277d1634dc16b51bc3d-157050868",
});

// Create a new payment
router.post(
  "/payments",
  checkAuth,
  checkRole(["user", "admin", "owner"]),
  async (req, res) => {
    try {
      const formData = req.body;
      const userId = req.userData._id;

      let errorMessage = null;
      //guardar solicitud en mongo, estado: pendiente
      const content = await Content.findById(formData.contentId);
      if (!content) {
        return res.status(404).json({ error: "Content not found" });
      }

      let paymentResponse;
      let paymentToSave = {
        userId: userId,
        contentId: formData.contentId,
        paymentId: null,
        paymentMethod: formData.paymentMethod,
        currency: formData.country.id,
        date: new Date(),
        videoId: formData.contentId,
        status: "pending",
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        address: formData.address,
        address2: formData.address2,
        city: formData.city,
        state: formData.state,
        country: formData.country.label,
        postalCode: formData.postalCode,
      };

      if (formData.paymentMethod === "mercadopago") {
        const priceMP = getPriceByCurrency(content.priceTable, "ARS");
        paymentResponse = await processMercadopagoPayment(
          formData.contentId,
          priceMP
        );
        paymentToSave.amount = priceMP;
        paymentToSave.netAmount = priceMP;

        paymentToSave.currency = "ARS";
        if (!paymentResponse.preference) {
          console.error("Failed to create payment 134");
          return res.status(500).json({ error: "Failed to create payment" });
        }
      } else if (formData.paymentMethod === "paypal") {
        const price = mapCurrencyToPaypal(
          content.priceTable,
          formData.country.id
        );

        if (!price || !price.price) {
          console.error("Price not available for the selected currency");
          return res
            .status(400)
            .json({ error: "Price not available for the selected currency" });
        }

        paymentResponse = await processPaypalPayment(
          price.price,
          price.currency
        );

        paymentToSave.amount = price.price;
        paymentToSave.currency = price.currency;

        if (
          !(
            paymentResponse.httpStatusCode === 201 ||
            paymentResponse.httpStatusCode === 200
          )
        ) {
          errorMessage = "Failed to create payment";
        } else {
          paymentToSave.paymentId = paymentResponse.jsonResponse.id;
        }
      } else {
        console.error("Error: line 170 - invalid payment mthod");
        return res.status(500).json({ error: "Invalid payment method" });
      }

      if (!paymentResponse || errorMessage !== null) {
        console.error("Error creating payment:", errorMessage);
        return res
          .status(500)
          .json({ error: errorMessage || "Failed to create payment" });
      }

      const paymentResult = await Payments.create(paymentToSave);

      // Return the payment preference ID
      res
        .json({
          paymentResponse: paymentResponse,
          preferenceRedirect: paymentResponse.init_point,
          orderId: paymentResult._id,
        })
        .status(200);
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(500).json({ error: "Failed to create payment" });
    }
  }
);

// Get user payments (no sensitive data)
router.get(
  "/payments",
  checkAuth,
  checkRole(["admin", "owner"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      // Get the payment status
      let payments = await Payments.find({ userId: id });

      if (payments.length === 0) {
        return res.status(404).json({ error: "No payments found" });
      }
      payments = payments.map((payment) => {
        return {
          _id: payment._id,
          videoId: payment.videoId,
          status: payment.status,
          date: payment.date,
          amount: payment.amount,
          netAmount: payment.netAmount,
          currency: payment.currency,
        };
      });

      res.status(200).json(payments);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to get payment status" });
    }
  }
);

// Get authenticated user's payments
router.get("/user/payments", checkAuth, async (req, res) => {
  try {
    const userId = req.userData._id;
    const { status } = req.query; // Optional status filter

    // Build query
    const query = { userId, nullDate: null };

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    // Get the user's payments
    const payments = await Payments.find(query);

    if (payments.length === 0) {
      return res
        .status(200)
        .json({ payments: [], message: "No payments found" });
    }

    // Get content information to display titles instead of IDs
    const contentIds = [...new Set(payments.map((p) => p.videoId))];
    const contents = await Content.find({ _id: { $in: contentIds } });

    // Format payments for response (remove sensitive data)
    const formattedPayments = payments.map((payment) => {
      const video = contents.find(
        (c) => c._id.toString() === payment.videoId.toString()
      );

      return {
        id: payment._id,
        videoId: payment.videoId,
        videoTitle: video ? video.title : "Unknown Video",
        status: payment.status,
        date: payment.date,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.paymentMethod,
      };
    });

    res.status(200).json({ payments: formattedPayments });
  } catch (error) {
    console.error("Error fetching user payments:", error);
    res.status(500).json({ error: "Failed to get user payments" });
  }
});

// Endpoint specifically for pending payments
router.get("/user/pending-payments", checkAuth, async (req, res) => {
  try {
    const userId = req.userData._id;

    // Query for pending payments
    const query = {
      userId,
      nullDate: null,
      status: { $in: ["pending", "in_process", "in_mediation"] },
    };

    // Get the user's pending payments
    const payments = await Payments.find(query);

    if (payments.length === 0) {
      return res
        .status(200)
        .json({ payments: [], message: "No pending payments found" });
    }

    // Get content information
    const contentIds = [...new Set(payments.map((p) => p.videoId))];
    const contents = await Content.find({ _id: { $in: contentIds } });

    // Format payments for response
    const formattedPayments = payments.map((payment) => {
      const video = contents.find(
        (c) => c._id.toString() === payment.videoId.toString()
      );

      return {
        id: payment._id,
        videoId: payment.videoId,
        videoTitle: video ? video.title : "Unknown Video",
        videoImage: video ? video.posterUrl : null,
        status: payment.status,
        date: payment.date,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.paymentMethod,
        preferenceUrl: payment.preferenceUrl, // For continuing unfinished payments
      };
    });

    res.status(200).json({ pendingPayments: formattedPayments });
  } catch (error) {
    console.error("Error fetching pending payments:", error);
    res.status(500).json({ error: "Failed to get pending payments" });
  }
});

// Get payment details
router.get(
  "/payment/:id",
  checkAuth,
  checkRole(["admin", "owner"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Get the payment details
      const payment = await Payments.findById(id);

      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      // Get additional info about the video and user
      const content = await Content.findById(payment.videoId);
      const videoTitle = content ? content.title : "Unknown Video";

      const paymentData = {
        id: payment._id,
        videoId: videoTitle,
        status: payment.status,
        date: payment.date,
        amount: payment.amount,
        netAmount: payment.netAmount,
        currency: payment.currency,
        userId: payment.userId,
        paymentMethod: payment.paymentMethod,
        paymentId: payment.paymentId,
        firstName: payment.firstName,
        lastName: payment.lastName,
        phone: payment.phone,
        address: payment.address,
        address2: payment.address2,
        city: payment.city,
        state: payment.state,
        country: payment.country,
        postalCode: payment.postalCode,
        userData: payment.userData,
      };

      res.status(200).json(paymentData);
    } catch (error) {
      console.error("Error fetching payment details:", error);
      res.status(500).json({ error: "Failed to get payment details" });
    }
  }
);

// Capture payment region

router.post("/payments/paypal/:orderID/capture", async (req, res) => {
  try {
    const { orderID } = req.params;
    const { jsonResponse, httpStatusCode } = await captureOrder(orderID);

    const errorDetail = jsonResponse?.details?.[0];
    if (errorDetail?.issue === "INSTRUMENT_DECLINED") {
      console.error("Failed to create order:", error);
      return res.status(500).json({ error: "Failed to capture order." });
    } else if (errorDetail) {
      // (2) Other non-recoverable errors -> Show a failure message
      await Payments.findOneAndUpdate(
        {
          paymentMethod: "paypal",
          paymentId: jsonResponse.id,
        },
        { userData: userData, status: "rejected" }
      );
      res.status(500).json({ error: "Failed to capture order." });
      throw new Error(`${errorDetail.description} (${jsonResponse.debug_id})`);
    } else {
      // (3) Successful transaction -> Show confirmation or thank you message
      const transaction = jsonResponse.purchase_units[0].payments.captures[0];

      const userData = {
        user: jsonResponse.payer,
        address: jsonResponse.purchase_units[0].shipping.address,
      };

      await Payments.findOneAndUpdate(
        {
          paymentMethod: "paypal",
          paymentId: jsonResponse.id,
        },
        {
          userData: userData,
          status: "completed",
          date: new Date(),
          currency: transaction.amount.currency_code,
          amount: transaction.amount.value,
          netAmount: transaction.seller_receivable_breakdown.net_amount.value,
        }
      );
    }
    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to capture order." });
  }
});

router.post("/payments/success", async (req, res) => {
  const payment = req.query;

  try {
    res.status(204).send("webhook");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get payment status" });
  }
});

router.post("/payments/webhook", async (req, res) => {
  const payment = req.query;
  const body = req.body;
  if (payment.type != "payment") {
    return res.status(204).send("webhook");
  }

  //prod only
  const signatureHeader = req.headers["x-signature"];
  const requestHeader = req.headers["x-request-id"];

  const signatureParts = signatureHeader.split(",");

  // Initializing variables to store ts and hash
  let ts;
  let hash;
  // Iterate over the values to obtain ts and v1
  signatureParts.forEach((part) => {
    // Split each part into key and value
    const [key, value] = part.split("=");
    if (key && value) {
      const trimmedKey = key.trim();
      const trimmedValue = value.trim();
      if (trimmedKey === "ts") {
        ts = trimmedValue;
      } else if (trimmedKey === "v1") {
        hash = trimmedValue;
      }
    }
  });

  const secret = process.env.MERCADOPAGO_SECRET;
  // Generate the manifest string
  const manifest = `id:${body.data.id};request-id:${requestHeader};ts:${ts};`;

  // Create an HMAC signature
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(manifest);

  // Obtain the hash result as a hexadecimal string
  const sha = hmac.digest("hex");

  if (sha === hash) {
    console.log("Payment!");
  } else {
    // HMAC verification failed
    console.log("HMAC verification failed");
    return res.status(400).send("HMAC verification failed");
  }

  var paymentData;
  var userInfo = null;
  try {
    await new Payment(client)
      .get({ id: body.data.id })
      .then((res) => (paymentData = res))
      .catch(console.log);

    paymentData.payer && (userInfo = paymentData.payer);
    await Payments.findOneAndUpdate(
      {
        paymentMethod: "mercadopago",
        videoId: paymentData.additional_info.items[0].id,
      },
      {
        status: paymentData.status,
        paymentyId: paymentData.id,
        userData: userInfo,
      }
    );

    res.status(204).send("webhook");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get payment status" });
  }
});

const processMercadopagoPayment = async (contentId, price) => {
  let paymentData;
  const requestMP = {
    body: {
      items: [
        {
          id: contentId,
          title: "AlmenWeb",
          description: "Contenido pagina web",
          quantity: 1,
          currency_id: "ARS",
          unit_price: price,
        },
      ],
      back_urls: {
        success: "https://almendragala.com/",
        failure: "https://almendragala.com/",
        pending: "https://almendragala.com/",
      },
      notification_url: "https://almendragala.com/api/payments/webhook",
      redirect_urls: {
        success: "https://almendragala.com/",
        failure: "https://almendragala.com/",
        pending: "https://almendragala.com/",
      },
    },
  };
  try {
    const preference = await new Preference(client)
      .create(requestMP)
      .then((res) => (paymentData = res))
      .catch((error) => console.error(error));

    return { preference: preference, init_point: preference.init_point };
  } catch (error) {
    return { preference: null, init_point: null };
  }
};

const processPaypalPayment = async (amount, currency) => {
  try {
    // use the cart information passed from the front-end to calculate the order amount detals

    const { jsonResponse, httpStatusCode } = await createOrder(
      amount.toFixed(2),
      currency
    );

    //res.status(httpStatusCode).json(jsonResponse);
    return { jsonResponse, httpStatusCode };
  } catch (error) {
    console.error("Failed to create order:", error);
    return { preference: null, init_point: null };
  }
};

/**
 * Create an order to start the transaction.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_create
 */
const createOrder = async (ammount, currency) => {
  const collect = {
    body: {
      intent: CheckoutPaymentIntent.CAPTURE,
      purchaseUnits: [
        {
          amount: {
            currencyCode: currency.toUpperCase(),
            value: ammount.toString(),
          },
        },
      ],
    },
    prefer: "return=minimal",
  };

  try {
    const { body, ...httpResponse } = await ordersController.ordersCreate(
      collect
    );

    // Get more response info...
    // const { statusCode, headers } = httpResponse;
    return {
      jsonResponse: JSON.parse(body),
      httpStatusCode: httpResponse.statusCode,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      // const { statusCode, headers } = error;
      return {
        jsonResponse: null,
        httpStatusCode: 500,
      };

      throw new Error(error.message);
    }
  }
};

/**
 * Capture payment for the created order to complete the transaction.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_capture
 */
const captureOrder = async (orderID) => {
  const collect = {
    id: orderID,
    prefer: "return=minimal",
  };

  try {
    const { body, ...httpResponse } = await ordersController.ordersCapture(
      collect
    );
    // Get more response info...
    // const { statusCode, headers } = httpResponse;
    return {
      jsonResponse: JSON.parse(body),
      httpStatusCode: httpResponse.statusCode,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      // const { statusCode, headers } = error;
      throw new Error(error.message);
    }
  }
};
function getPriceByCurrency(priceTable, currency) {
  return priceTable.get(currency.toLowerCase()) || null;
}

function mapCurrencyToPaypal(priceTable, currency) {
  const lowerCaseCurrency = currency.toLowerCase();

  if (supportedPaypalCurrencies.includes(currency.toUpperCase())) {
    const price = priceTable.get(lowerCaseCurrency);
    return { price: price || null, currency: currency.toUpperCase() };
  } else if (lowerCaseCurrency === "ars") {
    const usdPrice = priceTable.get("usd");
    return { price: usdPrice || null, currency: "USD" };
  } else {
    return null;
  }
}
module.exports = router;
