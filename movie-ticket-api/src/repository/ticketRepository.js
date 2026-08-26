import InforTicket from "../model/inforTicketModel.js";

class TicketRepository {
  async findAll(query, skip, limit) {
    const [tickets, total] = await Promise.all([
      InforTicket.find(query)
        .populate("showtime")
        .populate("user")
        .populate("seats.seatType")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      InforTicket.countDocuments(query),
    ]);
    return { tickets, total };
  }

  async findById(id) {
    return await Ticket.findById(id)
      .populate("showtime")
      .populate("user")
      .populate("seats.seatType")
      .lean();
  }

  async findByIdRaw(id) {
    return await InforTicket.findById(id);
  }

  async create(data) {
    return await InforTicket.create(data);
  }

  async updateById(id, updateData) {
    return await InforTicket.findByIdAndUpdate(id, updateData, { new: true })
      .populate("showtime")
      .populate("user")
      .populate("seats.seatType")
      .lean();
  }

  async deleteById(id) {
    return await InforTicket.findByIdAndDelete(id);
  }

  // Tìm kiếm vé kèm populate user thỏa mãn điều kiện match email/phone (dành cho staff)
  async searchWithUserPopulate(keywordRegex) {
    return await InforTicket.find()
      .populate({
        path: "user_id",
        match: {
          $or: [
            { email: { $regex: keywordRegex, $options: "i" } },
            { userphone: { $regex: keywordRegex, $options: "i" } },
          ],
        },
      })
      .lean();
  }

  // Cập nhật linh hoạt theo điều kiện (dành cho các thao tác update trạng thái, v.v.)
  async updateOneByCondition(filter, update, options = {}) {
    return await InforTicket.updateOne(filter, update, options);
  }
}

export default new TicketRepository();
