import * as ticketRepository from "../../service/ticketService.js";
import { sendSuccess, sendError, sendServerError } from "../../helper/client.js";
import crypto from "crypto";
import https from "https";
import querystring from "qs";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// ==================== VNPAY ====================
const vnpayConfig = {
  tmnCode: process.env.VNP_TMNCODE,
  hashSecret: process.env.VNP_HASHSECRET,
  url: process.env.VNP_URL,
  returnUrl: process.env.VNP_RETURNURL,
};

function sortObject(obj) {
  return Object.keys(obj).sort().reduce((acc, key) => {
    acc[key] = obj[key];
    return acc;
  }, {});
}

// ==================== MOMO ====================
const momoConfig = {
  partnerCode: process.env.MOMO_PARTNER_CODE,
  accessKey: process.env.MOMO_ACCESS_KEY,
  secretKey: process.env.MOMO_SECRET_KEY,
  endpoint: process.env.MOMO_ENDPOINT,
  // ipnUrl: server-to-server callback, dùng chung endpoint với return để đảm bảo DB luôn được update
  ipnUrl: process.env.MOMO_IPN_URL || "https://node-js-movie.vercel.app/api/payment/return_momo",
  returnUrl: process.env.MOMO_RETURN_URL,
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
    }
  },

  // ==================== VNPAY ====================
  vnpay: {
    // Tạo URL thanh toán, nhúng ticketId vào orderId để dùng lúc callback
    createPaymentUrl: async (res, req, ticketData) => {
      try {
        const ticketId = (ticketData._id || ticketData.id)?.toString();
        if (!ticketId) return sendError(res, "Thiếu ticket id", 400);

        const amount = ticketData.totalPrice || 100000;
        const createDate = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
        // orderId nhúng ticketId để parse lại khi callback
        const orderId = `${ticketId}-${Date.now()}`;

        let vnpParams = sortObject({
          vnp_Version: "2.1.0",
          vnp_Command: "pay",
          vnp_TmnCode: vnpayConfig.tmnCode,
          vnp_Locale: "vn",
          vnp_CurrCode: "VND",
          vnp_TxnRef: orderId,
          vnp_OrderInfo: `Thanh toan ve xem phim ${ticketId}`,
          vnp_OrderType: "other",
          vnp_Amount: amount * 100,
          vnp_ReturnUrl: "https://node-js-movie.vercel.app/api/payment/return_vnpay",
          vnp_IpAddr: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
          vnp_CreateDate: createDate,
        });

        const signData = querystring.stringify(vnpParams, { encode: false });
        vnpParams["vnp_SecureHash"] = crypto
          .createHmac("sha512", vnpayConfig.hashSecret)
          .update(Buffer.from(signData, "utf-8"))
          .digest("hex");

        const paymentUrl = `${vnpayConfig.url}?${querystring.stringify(vnpParams, { encode: false })}`;
        return sendSuccess(res, "Tạo link VNPay thành công", { paymentUrl });
      } catch (err) {
        return sendServerError(res);
      }
    },

    // VNPay redirect về đây sau khi thanh toán
    verifyReturn: async (res, query) => {
      try {
        const secureHash = query["vnp_SecureHash"];
        const params = { ...query };
        delete params["vnp_SecureHash"];
        delete params["vnp_SecureHashType"];

        const signData = querystring.stringify(sortObject(params), { encode: false });
        const checkHash = crypto
          .createHmac("sha512", vnpayConfig.hashSecret)
          .update(Buffer.from(signData, "utf-8"))
          .digest("hex");

        if (checkHash !== secureHash) {
          return res.redirect(`${FRONTEND_URL}/payment-result?status=failed&reason=invalid_signature`);
        }

        // Parse ticketId từ orderId (format: {ticketId}-{timestamp})
        const orderId = query["vnp_TxnRef"] || "";
        const ticketId = orderId.split("-")[0];
        const responseCode = query["vnp_ResponseCode"];

        if (responseCode === "00") {
          if (ticketId) await ticketRepository.confirmTicketPayment(ticketId);
          return res.redirect(`${FRONTEND_URL}/payment-result?status=success&method=vnpay&ticketId=${ticketId}`);
        } else {
          if (ticketId) await ticketRepository.cancelTicket(ticketId);
          return res.redirect(`${FRONTEND_URL}/payment-result?status=failed&method=vnpay&code=${responseCode}`);
        }
      } catch (err) {
        return res.redirect(`${FRONTEND_URL}/payment-result?status=error`);
      }
    }
  },

  // ==================== MOMO ====================
  momo: {
    // Tạo URL thanh toán, nhúng ticketId vào orderId
    createPaymentUrl: async (res, ticketData) => {
      try {
        const ticketId = (ticketData._id || ticketData.id)?.toString();
        if (!ticketId) return sendError(res, "Thiếu ticket id", 400);

        const amount = (ticketData.totalPrice || 100000).toString();
        // orderId nhúng ticketId để parse lại khi callback
        const orderId = `${ticketId}-${Date.now()}`;
        const requestId = orderId;
        const orderInfo = `Thanh toan ve xem phim ${ticketId}`;
        const extraData = "";

        const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${momoConfig.ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${momoConfig.partnerCode}&redirectUrl=${momoConfig.returnUrl}&requestId=${requestId}&requestType=payWithMethod`;
        const signature = crypto.createHmac("sha256", momoConfig.secretKey).update(rawSignature).digest("hex");

        const body = JSON.stringify({
          partnerCode: momoConfig.partnerCode,
          accessKey: momoConfig.accessKey,
          requestId, amount, orderId, orderInfo,
          redirectUrl: "https://node-js-movie.vercel.app/api/payment/return_momo",
          ipnUrl: momoConfig.ipnUrl,
          extraData, requestType: "payWithMethod", signature, lang: "vi",
        });

        const url = new URL(momoConfig.endpoint);
        const options = {
          hostname: url.hostname,
          path: url.pathname,
          method: "POST",
          headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
        };

        return new Promise((resolve) => {
          const request = https.request(options, (response) => {
            let data = "";
            response.on("data", chunk => data += chunk);
            response.on("end", () => {
              const result = JSON.parse(data);
              if (result.resultCode === 0) {
                resolve(sendSuccess(res, "Tạo link MoMo thành công", { paymentUrl: result.payUrl }));
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
        const { partnerCode, orderId, requestId, amount, orderInfo, orderType,
          transId, resultCode, message, payType, responseTime, extraData, signature } = query;

        const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
        const checkSignature = crypto.createHmac("sha256", momoConfig.secretKey).update(rawSignature).digest("hex");

        if (checkSignature !== signature) {
          return res.redirect(`${FRONTEND_URL}/payment-result?status=failed&reason=invalid_signature`);
        }

        // Parse ticketId từ orderId (format: {ticketId}-{timestamp})
        const ticketId = (orderId || "").split("-")[0];

        if (resultCode === "0") {
          if (ticketId) await ticketRepository.confirmTicketPayment(ticketId);
          return res.redirect(`${FRONTEND_URL}/payment-result?status=success&method=momo&ticketId=${ticketId}`);
        } else {
          if (ticketId) await ticketRepository.cancelTicket(ticketId);
          return res.redirect(`${FRONTEND_URL}/payment-result?status=failed&method=momo&code=${resultCode}`);
        }
      } catch (err) {
        return res.redirect(`${FRONTEND_URL}/payment-result?status=error`);
      }
    }
  }
};
