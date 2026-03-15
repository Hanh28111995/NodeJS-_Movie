import * as ticketRepository from "../../service/ticketService.js";

export const PaymentService = {
  cash: {
    createPaymentUrl: async (res, ticketData) => {
      const ticket = await ticketRepository.confirmTicketPayment(ticketData.id);
      return res.status(200).json({ success: true, message: "Thanh toán tiền mặt thành công", data: ticket });
    }
  },
  vnpay: {
    createPaymentUrl: async (res, req, ticket) => {
      // Logic VNPAY ở đây
      return res.status(200).json({ success: true, message: "Chức năng VNPAY đang được bảo trì" });
    },
    verifyResponse: async (res, query) => {
      return res.status(200).json({ success: true, message: "Xác minh VNPAY thành công" });
    }
  },
  momo: {
    createPaymentUrl: async (res, ticket) => {
      // Logic MoMo ở đây
      return res.status(200).json({ success: true, message: "Chức năng MoMo đang được bảo trì" });
    },
    verifyResponse: async (res, query) => {
      return res.status(200).json({ success: true, message: "Xác minh MoMo thành công" });
    }
  }
};
