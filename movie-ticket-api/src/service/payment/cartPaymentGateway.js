import crypto from "crypto";
import https from "https";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const VNP_RETURN_URL =
  "https://node-js-movie.vercel.app/api/payment/return_vnpay";
const MOMO_RETURN_URL =
  "https://node-js-movie.vercel.app/api/payment/return_momo";

const toSignData = (params) =>
  Object.keys(params)
    .sort()
    .map(
      (key) =>
        `${key}=${encodeURIComponent(params[key]).replace(/%20/g, "+")}`,
    )
    .join("&");

const timingSafeEqualHex = (first, second) => {
  if (
    !/^[0-9a-f]+$/i.test(first || "") ||
    !/^[0-9a-f]+$/i.test(second || "") ||
    first.length !== second.length
  ) {
    return false;
  }
  return crypto.timingSafeEqual(
    Buffer.from(first, "hex"),
    Buffer.from(second, "hex"),
  );
};

const paymentResultUrl = (status, params = {}) => {
  const query = new URLSearchParams({ status, ...params });
  return `${FRONTEND_URL}/payment-result?${query}`;
};

const createVnpayUrl = (payment, req) => {
  const tmnCode = process.env.VNP_TMNCODE;
  const hashSecret = process.env.VNP_HASHSECRET;
  const vnpUrl = process.env.VNP_URL;
  if (!tmnCode || !hashSecret || !vnpUrl) {
    throw new Error("Cấu hình VNPay chưa đầy đủ");
  }

  const now = new Date();
  const dateParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const dateValues = Object.fromEntries(
    dateParts.map(({ type, value }) => [type, value]),
  );
  const createDate = `${dateValues.year}${dateValues.month}${dateValues.day}${dateValues.hour}${dateValues.minute}${dateValues.second}`;
  const ipAddr = String(
    req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress ||
      "127.0.0.1",
  ).split(",")[0];
  const params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: `PAY_${payment._id}`,
    vnp_OrderInfo: `Thanh toan ${payment.paymentId}`,
    vnp_OrderType: "other",
    vnp_Amount: Math.round(payment.totalAmount) * 100,
    vnp_ReturnUrl: VNP_RETURN_URL,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
  };
  const signature = crypto
    .createHmac("sha512", hashSecret)
    .update(toSignData(params))
    .digest("hex");
  const url = new URL(vnpUrl);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }
  url.searchParams.set("vnp_SecureHash", signature);
  return url.toString();
};

const postJson = (endpoint, payload) =>
  new Promise((resolve, reject) => {
    let url;
    try {
      url = new URL(endpoint);
    } catch {
      reject(new Error("Cấu hình endpoint MoMo không hợp lệ"));
      return;
    }

    const body = JSON.stringify(payload);
    const request = https.request(
      {
        hostname: url.hostname,
        port: url.port || 443,
        path: `${url.pathname}${url.search}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (response) => {
        let responseBody = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          responseBody += chunk;
        });
        response.on("end", () => {
          try {
            const result = JSON.parse(responseBody);
            if (response.statusCode < 200 || response.statusCode >= 300) {
              reject(new Error("MoMo không tạo được giao dịch"));
            } else {
              resolve(result);
            }
          } catch {
            reject(new Error("Phản hồi MoMo không hợp lệ"));
          }
        });
      },
    );
    request.on("error", reject);
    request.write(body);
    request.end();
  });

const createMomoUrl = async (payment) => {
  const { partnerCode, accessKey, secretKey, endpoint } = process.env;
  if (!partnerCode || !accessKey || !secretKey || !endpoint) {
    throw new Error("Cấu hình MoMo chưa đầy đủ");
  }
  const orderId = `PAY_${payment._id}`;
  const requestId = orderId;
  const amount = String(Math.round(payment.totalAmount));
  const orderInfo = `Thanh toan ${payment.paymentId}`;
  const extraData = "";
  const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${MOMO_RETURN_URL}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${MOMO_RETURN_URL}&requestId=${requestId}&requestType=payWithMethod`;
  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");
  const result = await postJson(endpoint, {
    partnerCode,
    accessKey,
    requestId,
    amount,
    orderId,
    orderInfo,
    redirectUrl: MOMO_RETURN_URL,
    ipnUrl: MOMO_RETURN_URL,
    extraData,
    requestType: "payWithMethod",
    signature,
    lang: "vi",
  });
  if (result.resultCode !== 0 || !result.payUrl) {
    throw new Error(result.message || "MoMo không tạo được liên kết thanh toán");
  }
  return result.payUrl;
};

export const createGatewayUrl = (payment, req) => {
  if (payment.paymentMethod === "VNPAY") {
    return Promise.resolve(createVnpayUrl(payment, req));
  }
  if (payment.paymentMethod === "MOMO") return createMomoUrl(payment);
  throw new Error("Phương thức thanh toán online không được hỗ trợ");
};

export const verifyVnpayReturn = (query) => {
  const secret = process.env.VNP_HASHSECRET;
  if (!secret || !query.vnp_SecureHash) return false;
  const params = { ...query };
  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;
  const expected = crypto
    .createHmac("sha512", secret)
    .update(toSignData(params))
    .digest("hex");
  return timingSafeEqualHex(expected, query.vnp_SecureHash);
};

export const verifyMomoReturn = (query) => {
  const { accessKey, secretKey } = process.env;
  if (!accessKey || !secretKey || !query.signature) return false;
  const {
    orderId,
    requestId,
    amount,
    orderInfo,
    orderType,
    transId,
    resultCode,
    message,
    payType,
    responseTime,
    extraData,
    partnerCode,
    signature,
  } = query;
  const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
  const expected = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");
  return timingSafeEqualHex(expected, signature);
};

export const paymentRedirect = paymentResultUrl;
