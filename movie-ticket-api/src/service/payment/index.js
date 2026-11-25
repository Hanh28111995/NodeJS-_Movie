import * as ticketRepository from "./../../service/ticketService.js";
import * as couponService from "./../../service/couponService.js";
import {
  sendSuccess,
  sendError,
  sendServerError,
} from "../../helper/client.js";
import crypto from "crypto";
import https from "https";

// Build query string để ký — encode value, space thành + (chuẩn VNPay)
function toSignData(obj) {
  return Object.keys(obj)
    .sort()
    .map((k) => `\({k}=\){encodeURIComponent(obj[k]).replace(/%20/g, "+")}`)
    .join("&");
}

// Build query string cho URL — encode value
function toQueryString(obj) {
  return Object.keys(obj)
    .sort()
    .map((k) => `\({k}=\){encodeURIComponent(obj[k])}`)
    .join("&");
}

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// ==================== VNPAY ====================
const VNP_RETURN_URL =
  "https://node-js-movie.vercel.app/api/payment/return_vnpay";

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

const getMomoConfig = () => ({
  partnerCode: process.env.MOMO_PARTNER_CODE?.trim(),
  accessKey: process.env.MOMO_ACCESS_KEY?.trim(),
  secretKey: process.env.MOMO_SECRET_KEY?.trim(),
  endpoint: process.env.MOMO_ENDPOINT?.trim(),
  redirectUrl: MOMO_RETURN_URL,
  ipnUrl: MOMO_RETURN_URL,
});

export const PaymentService = {
  // ==================== CASH ====================
  cash: {
    confirm: async (res, ticketData) => {
      const ticketId = ticketData.id || ticketData._id;
      if (!ticketId) return sendError(res, "Thiếu ticket id", 400);
      const ticket = await ticketRepository.confirmTicket(ticketId);
      if (!ticket) return sendError(res, "Không tìm thấy vé", 404);
      return sendSuccess(res, "Thanh toán tiền mặt thành công", ticket);
    },
  },

  // ==================== VNPAY ====================
  vnpay: {
    // Tạo URL thanh toán, nhúng ticketId vào orderId
    createPaymentUrl: async (res, req, ticketData) => {
      try {
        const ticketId = (ticketData._id || ticketData.id)?.toString();
        if (!ticketId) return sendError(res, "Thiếu ticket id", 400);

        const rawAmount =
          ticketData?.finalAmount ??
          ticketData?.totalAmount ??
          calcTotalPrice(ticketData.seatName);
        const amount = Math.round(Number(rawAmount));
        if (!Number.isFinite(amount) || amount <= 0) {
          return sendError(res, "Không tính được tổng tiền vé", 400);
        }

        // Định dạng: yyyyMMddHHmmss theo múi giờ Việt Nam (UTC+7)
        const vnDate = new Date(Date.now() + 7 * 60 * 60 * 1000);
        const createDate = vnDate
          .toISOString()
          .replace(/[-:T.Z]/g, "")
          .slice(0, 14);
        const orderId = `${ticketId}__${Date.now()}`;
        const orderInfo = buildOrderInfo(ticketData.seatName);

        const tmnCode = process.env.VNP_TMNCODE?.trim();
        const hashSecret = process.env.VNP_HASHSECRET?.trim();
        const vnpUrl = process.env.VNP_URL?.trim();
        const returnUrl = (
          process.env.VNP_RETURN_URL || VNP_RETURN_URL
        )?.trim();

        // Lấy IP đầu tiên sạch sẽ của người dùng trên proxy / Vercel
        const forwarded = req.headers["x-forwarded-for"];
        const ipAddr =
          (Array.isArray(forwarded)
            ? forwarded[0]
            : forwarded?.split(",")[0]?.trim()) ||
          req.socket?.remoteAddress ||
          req.connection?.remoteAddress ||
          "127.0.0.1";

        if (!tmnCode || !hashSecret || !vnpUrl || !returnUrl) {
          console.error("[VNPay] Missing env configuration");
          return sendError(res, "Cấu hình VNPay chưa đầy đủ", 500);
        }

        const vnpParams = {
          vnp_Version: "2.1.0",
          vnp_Command: "pay",
          vnp_TmnCode: tmnCode,
          vnp_Locale: "vn",
          vnp_CurrCode: "VND",
          vnp_TxnRef: orderId,
          vnp_OrderInfo: orderInfo,
          vnp_OrderType: "other",
          vnp_Amount: amount * 100,
          vnp_ReturnUrl: returnUrl,
          vnp_IpAddr: ipAddr,
          vnp_CreateDate: createDate,
        };

        const signData = toSignData(vnpParams);
        const signed = crypto
          .createHmac("sha512", hashSecret)
          .update(Buffer.from(signData, "utf-8"))
          .digest("hex");

        vnpParams.vnp_SecureHash = signed;
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
        const hashSecret = process.env.VNP_HASHSECRET?.trim();
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
          const ticket = ticketId
            ? await ticketRepository.completeTicket(ticketId)
            : null;

          if (ticket) {
            const uid = String(ticket.user_id?._id || ticket.user_id);
            if (ticket.couponCode) {
              await couponService.consumeCoupon(ticket.couponCode, uid);
            }
          }

          return res.redirect(
            `${FRONTEND_URL}/payment-result?status=success&method=vnpay&ticketId=${ticketId}`,
          );
        } else {
          const ticket = ticketId
            ? await ticketRepository.cancelTicket(ticketId)
            : null;

          // Thanh toán thất bại/hủy: Chỉ giải phóng hold, không tăng usedCount
          if (ticket && ticket.couponCode) {
            await couponService.releaseCouponHoldOnly(
              ticket.couponCode,
              ticket.user_id,
            );
          }

          return res.redirect(
            `${FRONTEND_URL}/payment-result?status=failed&method=vnpay&code=${responseCode}`,
          );
        }
      } catch (err) {
        console.error("[VNPay verifyReturn] ERROR:", err.message);
        return res.redirect(`${FRONTEND_URL}/payment-result?status=error`);
      }
    },
  },

  // ==================== MOMO ====================
  momo: {
    // Tạo URL thanh toán, nhúng ticketId vào orderId
    createPaymentUrl: async (res, ticketData) => {
      try {
        const ticketId = (ticketData?._id || ticketData?.id)?.toString();
        if (!ticketId) {
          return sendError(res, "Thiếu ticket id", 400);
        }

        const rawAmount =
          ticketData?.finalAmount ??
          ticketData?.totalAmount ??
          calcTotalPrice(ticketData?.seatName);
        const numericAmount = Math.round(Number(rawAmount));

        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
          return sendError(res, "Không tính được tổng tiền vé", 400);
        }

        const momoCfg = getMomoConfig();
        if (
          !momoCfg.partnerCode ||
          !momoCfg.accessKey ||
          !momoCfg.secretKey ||
          !momoCfg.endpoint
        ) {
          console.error("[MoMo] Missing env configuration:", {
            hasPartnerCode: Boolean(momoCfg.partnerCode),
            hasAccessKey: Boolean(momoCfg.accessKey),
            hasSecretKey: Boolean(momoCfg.secretKey),
            hasEndpoint: Boolean(momoCfg.endpoint),
          });
          return sendError(res, "Cấu hình MoMo chưa đầy đủ", 500);
        }

        const amount = String(numericAmount);
        const orderId = `${ticketId}__${Date.now()}`;
        const requestId = orderId;
        const orderInfo =
          buildOrderInfo(ticketData?.seatName) || "Thanh toan ve";
        const extraData = "";
        const requestType = "payWithMethod";
        const redirectUrl = momoCfg.redirectUrl || MOMO_RETURN_URL;
        const ipnUrl = momoCfg.ipnUrl || redirectUrl;

        const rawSignature =
          `accessKey=${momoCfg.accessKey}` +
          `&amount=${amount}` +
          `&extraData=${extraData}` +
          `&ipnUrl=${ipnUrl}` +
          `&orderId=${orderId}` +
          `&orderInfo=${orderInfo}` +
          `&partnerCode=${momoCfg.partnerCode}` +
          `&redirectUrl=${redirectUrl}` +
          `&requestId=${requestId}` +
          `&requestType=${requestType}`;

        const signature = crypto
          .createHmac("sha256", momoCfg.secretKey)
          .update(rawSignature)
          .digest("hex");

        const body = JSON.stringify({
          partnerCode: momoCfg.partnerCode,
          accessKey: momoCfg.accessKey,
          requestId,
          amount,
          orderId,
          orderInfo,
          redirectUrl,
          ipnUrl,
          extraData,
          requestType,
          signature,
          lang: "vi",
        });

        const url = new URL(momoCfg.endpoint.trim());
        console.log("Calling MoMo Endpoint:", url.href);

        const options = {
          hostname: url.hostname,
          port: url.port || 443,
          path: `${url.pathname}${url.search}`,
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=UTF-8",
            "Content-Length": Buffer.byteLength(body),
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            Accept: "application/json",
          },
        };

        return await new Promise((resolve) => {
          let settled = false;
          const done = (fn) => {
            if (!settled) {
              settled = true;
              resolve(fn());
            }
          };

          const request = https.request(options, (response) => {
            let data = "";
            response.on("data", (chunk) => {
              data += chunk;
            });

            response.on("end", () => {
              try {
                const result = JSON.parse(data);
                if (Number(result.resultCode) === 0 && result.payUrl) {
                  return done(() =>
                    sendSuccess(res, "Tạo link MoMo thành công", {
                      paymentUrl: result.payUrl,
                    }),
                  );
                }

                console.warn("[MoMo createPaymentUrl rejected]:", {
                  statusCode: response.statusCode,
                  resultCode: result.resultCode,
                  message: result.message,
                  orderId,
                });

                return done(() =>
                  sendError(
                    res,
                    result.message || "MoMo từ chối tạo giao dịch",
                    400,
                  ),
                );
              } catch (parseErr) {
                console.error("[MoMo 502 parse error]:", {
                  statusCode: response.statusCode,
                  rawData: data,
                  error: parseErr.message,
                });
                return done(() =>
                  sendError(res, "Phản hồi từ MoMo không hợp lệ", 502),
                );
              }
            });
          });

          request.setTimeout(8000, () => {
            request.destroy();
            console.error("[MoMo 504 timeout]:", {
              orderId,
              endpoint: momoCfg.endpoint,
            });
            done(() =>
              sendError(
                res,
                "Cổng thanh toán MoMo phản hồi quá lâu (timeout)",
                504,
              ),
            );
          });

          request.on("error", (reqErr) => {
            console.error("[MoMo 502 network error]:", {
              message: reqErr.message,
              code: reqErr.code,
              endpoint: momoCfg.endpoint,
            });
            done(() =>
              sendError(res, `Lỗi kết nối tới MoMo: ${reqErr.message}`, 502),
            );
          });

          request.write(body);
          request.end();
        });
      } catch (err) {
        console.error("[MoMo createPaymentUrl unexpected error]:", err);
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

        const rawSignature = `accessKey=\({momoConfig.accessKey}&amount=\){amount}&extraData=\({extraData}&message=\){message}&orderId=\({orderId}&orderInfo=\){orderInfo}&orderType=\({orderType}&partnerCode=\){partnerCode}&payType=\({payType}&requestId=\){requestId}&responseTime=\({responseTime}&resultCode=\){resultCode}&transId=${transId}`;
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
          const ticket = ticketId
            ? await ticketRepository.completeTicket(ticketId)
            : null;

          const uid = String(ticket.user_id?._id || ticket.user_id);
          if (ticket && ticket.couponCode) {
            await couponService.consumeCoupon(ticket.couponCode, uid);
          }

          return res.redirect(
            `\({FRONTEND_URL}/payment-result?status=success&method=momo&ticketId=\){ticketId}`,
          );
        } else {
          const ticket = ticketId
            ? await ticketRepository.cancelTicket(ticketId)
            : null;

          // Thanh toán thất bại/hủy: Chỉ giải phóng hold, không tăng usedCount[cite: 5]
          if (ticket && ticket.couponCode) {
            await couponService.releaseCouponHoldOnly(
              ticket.couponCode,
              ticket.user_id,
            );
          }

          return res.redirect(
            `\({FRONTEND_URL}/payment-result?status=failed&method=momo&code=\){resultCode}`,
          );
        }
      } catch (err) {
        return res.redirect(`${FRONTEND_URL}/payment-result?status=error`);
      }
    },
  },
};
