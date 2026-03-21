import * as ticketRepository from "../../service/ticketService.js";
import {
  sendSuccess,
  sendError,
  sendServerError,
} from "../../helper/client.js";
import crypto from "crypto";
import https from "https";

// Build query string để ký — sort key, encode value (chuẩn VNPay v2.1.0)
function toSignData(obj) {
  return Object.keys(obj).sort()
    .map(k => `${k}=${encodeURIComponent(obj[k])}`)
    .join("&");
}

// Build query string cho URL — sort key, encode value
function toQueryString(obj) {
  return Object.keys(obj).sort()
    .map(k => `${k}=${encodeURIComponent(obj[k])}`)
    .join("&");
}

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// ==================== VNPAY ====================
const VNP_RETURN_URL = "https://node-js-movie.vercel.app/api/payment/return_vnpay";



// Tính tổng tiền từ seatName array — price đã được enrich từ DB ở controller
function calcTotalPrice(seatName = []) {
  return seatName.reduce((sum, seat) => sum + (Number(seat.price) || 0), 0);
}

// Tạo orderInfo từ seatName array — chỉ dùng ký tự alphanumeric để tránh lỗi chữ ký
function buildOrderInfo(seatName = []) {
  const seatList = seatName
    .map((s) => s.seatNumber)
    .filter(Boolean)
    .join(" ");
  return `Thanh toan ve ${seatList}`.replace(/[^a-zA-Z0-9 ]/g, "");
}

// ==================== MOMO ====================
const MOMO_RETURN_URL =
  "https://node-js-movie.vercel.app/api/payment/return_momo";

const momoConfig = {
  partnerCode: process.env.MOMO_PARTNER_CODE,
  accessKey: process.env.MOMO_ACCESS_KEY,
  secretKey: process.env.MOMO_SECRET_KEY,
  endpoint: process.env.MOMO_ENDPOINT,
  // cả redirectUrl và ipnUrl đều trỏ về BE để verify, BE sẽ redirect sang FE sau
  redirectUrl: MOMO_RETURN_URL,
  ipnUrl: MOMO_RETURN_URL,
};

export const PaymentService = {
  // ==================== CASH ====================
  cash: {
    confirm: async (res, ticketData) => {
      const ticketId = ticketData.id || ticketData._id;
      if (!ticketId) return sendError(res, "Thiếu ticket id", 400);
      const ticket = await ticketRepository.confirmTicketPayment(ticketId);
      if (!ticket) return sendError(res, "Không tìm thấy vé", 404);
      return sendSuccess(res, "Thanh toán tiền mặt thành công", ticket);
    },
  },

  // ==================== VNPAY ====================
  vnpay: {
    // Tạo URL thanh toán, nhúng ticketId vào orderId để dùng lúc callback
    createPaymentUrl: async (res, req, ticketData) => {
      try {
        const ticketId = (ticketData._id || ticketData.id)?.toString();
        if (!ticketId) return sendError(res, "Thiếu ticket id", 400);

        const amount = calcTotalPrice(ticketData.seatName);
        if (!amount) return sendError(res, "Không tính được tổng tiền vé", 400);

        // Định dạng: yyyyMMddHHmmss
        const createDate = new Date()
          .toISOString()
          .replace(/[-:T.Z]/g, "")
          .slice(0, 14);
        const orderId = `${ticketId}__${Date.now()}`;
        const orderInfo = buildOrderInfo(ticketData.seatName);

        const tmnCode = process.env.VNP_TMNCODE;
        const hashSecret = process.env.VNP_HASHSECRET;
        const vnpUrl = process.env.VNP_URL;

        // Lấy IP thực tế của người dùng
        const ipAddr =
          req.headers["x-forwarded-for"] ||
          req.connection.remoteAddress ||
          req.socket.remoteAddress ||
          "127.0.0.1";

        if (!tmnCode || !hashSecret || !vnpUrl) {
          console.error("[VNPay] Missing env configuration");
          return sendError(res, "Cấu hình VNPay chưa đầy đủ", 500);
        }

        let vnpParams = {
          vnp_Version: "2.1.0",
          vnp_Command: "pay",
          vnp_TmnCode: tmnCode,
          vnp_Locale: "vn",
          vnp_CurrCode: "VND",
          vnp_TxnRef: orderId,
          vnp_OrderInfo: orderInfo,
          vnp_OrderType: "other",
          vnp_Amount: amount * 100,
          vnp_ReturnUrl: VNP_RETURN_URL,
          vnp_IpAddr: ipAddr,
          vnp_CreateDate: createDate,
        };

        // 1. Tạo signData từ params đã sort, không encode
        const signData = toSignData(vnpParams);
        console.log("[VNPay] signData:", signData);

        // 2. Hash HMAC-SHA512
        const signed = crypto.createHmac("sha512", hashSecret)
          .update(Buffer.from(signData, "utf-8"))
          .digest("hex");
        console.log("[VNPay] signed:", signed);

        // 3. Build URL với encode
        vnpParams["vnp_SecureHash"] = signed;
        const paymentUrl = `${vnpUrl}?${toQueryString(vnpParams)}`;

        return sendSuccess(res, "Tạo link VNPay thành công", { paymentUrl });
      } catch (err) {
        console.error("[VNPay createPaymentUrl] ERROR:", err.message);
        return sendServerError(res);
      }
    },

    // VNPay redirect về đây sau khi thanh toán
    verifyReturn: async (res, query) => {
      try {
        const hashSecret = process.env.VNP_HASHSECRET;
        const secureHash = query["vnp_SecureHash"];
        const params = { ...query };
        delete params["vnp_SecureHash"];
        delete params["vnp_SecureHashType"];

        const signData = toSignData(params);
        const checkHash = crypto
          .createHmac("sha512", hashSecret)
          .update(Buffer.from(signData, "utf-8"))
          .digest("hex");

        if (checkHash !== secureHash) {
          return res.redirect(
            `${FRONTEND_URL}/payment-result?status=failed&reason=invalid_signature`,
          );
        }

        // Parse ticketId từ orderId (format: {ticketId}__{timestamp})
        const orderId = query["vnp_TxnRef"] || "";
        const ticketId = orderId.split("__")[0];
        const responseCode = query["vnp_ResponseCode"];

        if (responseCode === "00") {
          if (ticketId) await ticketRepository.confirmTicketPayment(ticketId);
          return res.redirect(
            `${FRONTEND_URL}/payment-result?status=success&method=vnpay&ticketId=${ticketId}`,
          );
        } else {
          if (ticketId) await ticketRepository.cancelTicket(ticketId);
          return res.redirect(
            `${FRONTEND_URL}/payment-result?status=failed&method=vnpay&code=${responseCode}`,
          );
        }
      } catch (err) {
        return res.redirect(`${FRONTEND_URL}/payment-result?status=error`);
      }
    },
  },

  // ==================== MOMO ====================
  momo: {
    // Tạo URL thanh toán, nhúng ticketId vào orderId
    createPaymentUrl: async (res, ticketData) => {
      try {
        const ticketId = (ticketData._id || ticketData.id)?.toString();
        if (!ticketId) return sendError(res, "Thiếu ticket id", 400);

        const amount = String(calcTotalPrice(ticketData.seatName));
        if (!Number(amount))
          return sendError(res, "Không tính được tổng tiền vé", 400);
        const orderId = `${ticketId}__${Date.now()}`;
        const requestId = orderId;
        const orderInfo = buildOrderInfo(ticketData.seatName);
        const extraData = "";

        const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${momoConfig.ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${momoConfig.partnerCode}&redirectUrl=${momoConfig.redirectUrl}&requestId=${requestId}&requestType=payWithMethod`;
        const signature = crypto
          .createHmac("sha256", momoConfig.secretKey)
          .update(rawSignature)
          .digest("hex");

        const body = JSON.stringify({
          partnerCode: momoConfig.partnerCode,
          accessKey: momoConfig.accessKey,
          requestId,
          amount,
          orderId,
          orderInfo,
          redirectUrl:
            "https://node-js-movie.vercel.app/api/payment/return_momo",
          ipnUrl: "https://node-js-movie.vercel.app/api/payment/return_momo",
          extraData,
          requestType: "payWithMethod",
          signature,
          lang: "vi",
        });

        const url = new URL(momoConfig.endpoint);
        const options = {
          hostname: url.hostname,
          path: url.pathname,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(body),
          },
        };

        return new Promise((resolve) => {
          const request = https.request(options, (response) => {
            let data = "";
            response.on("data", (chunk) => (data += chunk));
            response.on("end", () => {
              const result = JSON.parse(data);
              if (result.resultCode === 0) {
                resolve(
                  sendSuccess(res, "Tạo link MoMo thành công", {
                    paymentUrl: result.payUrl,
                  }),
                );
              } else {
                resolve(sendError(res, result.message, 400));
              }
            });
          });
          request.on("error", () => resolve(sendServerError(res)));
          request.write(body);
          request.end();
        });
      } catch (err) {
        return sendServerError(res);
      }
    },

    // MoMo redirect về đây sau khi thanh toán
    verifyReturn: async (res, query) => {
      try {
        const {
          partnerCode,
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
          signature,
        } = query;

        const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
        const checkSignature = crypto
          .createHmac("sha256", momoConfig.secretKey)
          .update(rawSignature)
          .digest("hex");

        if (checkSignature !== signature) {
          return res.redirect(
            `${FRONTEND_URL}/payment-result?status=failed&reason=invalid_signature`,
          );
        }

        // Parse ticketId từ orderId (format: {ticketId}__{timestamp})
        const ticketId = (orderId || "").split("__")[0];

        if (resultCode === "0") {
          if (ticketId) await ticketRepository.confirmTicketPayment(ticketId);
          return res.redirect(
            `${FRONTEND_URL}/payment-result?status=success&method=momo&ticketId=${ticketId}`,
          );
        } else {
          if (ticketId) await ticketRepository.cancelTicket(ticketId);
          return res.redirect(
            `${FRONTEND_URL}/payment-result?status=failed&method=momo&code=${resultCode}`,
          );
        }
      } catch (err) {
        return res.redirect(`${FRONTEND_URL}/payment-result?status=error`);
      }
    },
  },
};
