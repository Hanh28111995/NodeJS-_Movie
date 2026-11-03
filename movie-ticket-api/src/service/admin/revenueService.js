import InforTicket from "../../model/inforTicketModel.js";
import Orders from "../../model/orderModel.js";
import Payments from "../../model/paymentModel.js";

const TIME_ZONE = "Asia/Ho_Chi_Minh";
const CHANNELS = ["cash", "banking"];

const getLocalDate = (date) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
};

const formatUtcDate = (date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;

const addDays = (dateString, days) => {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return formatUtcDate(date);
};

const getReportRange = (period, now) => {
  const today = getLocalDate(now);
  let startDate = today;

  if (period === "week") {
    const weekday = new Date(`${today}T00:00:00Z`).getUTCDay();
    startDate = addDays(today, -((weekday + 6) % 7));
  } else if (period === "month") {
    startDate = `${today.slice(0, 7)}-01`;
  }

  const start = new Date(`${startDate}T00:00:00+07:00`);
  const end = now;
  return { startDate, start, end };
};

const makeAggregation = (
  amountExpression,
  start,
  end,
  { statusField = "paymentStatus", excludeLinkedPayments = false } = {},
) => [
  {
    $match: {
      [statusField]: "Completed",
      ...(excludeLinkedPayments ? { payment_id: { $exists: false } } : {}),
      $or: [
        { paidAt: { $gte: start, $lt: end } },
        {
          paidAt: { $in: [null] },
          updatedAt: { $gte: start, $lt: end },
        },
      ],
    },
  },
  {
    $set: {
      reportDate: { $ifNull: ["$paidAt", "$updatedAt"] },
      reportChannel: {
        $cond: [
          {
            $eq: [
              { $toLower: { $ifNull: ["$paymentMethod", ""] } },
              "cash",
            ],
          },
          "cash",
          "banking",
        ],
      },
      reportAmount: amountExpression,
    },
  },
  {
    $group: {
      _id: {
        date: {
          $dateToString: {
            date: "$reportDate",
            format: "%Y-%m-%d",
            timezone: TIME_ZONE,
          },
        },
        channel: "$reportChannel",
      },
      invoiceCount: { $sum: 1 },
      revenue: { $sum: "$reportAmount" },
    },
  },
];

const toNumber = (value) => Number(value) || 0;

const createTotals = () => ({ invoiceCount: 0, revenue: 0 });

const addRow = (totals, row) => {
  totals.invoiceCount += toNumber(row.invoiceCount);
  totals.revenue += toNumber(row.revenue);
};

export const getRevenueReport = async (period = "shift") => {
  if (!["shift", "week", "month"].includes(period)) {
    const error = new Error("period chỉ chấp nhận shift, week hoặc month");
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();
  const { startDate, start, end } = getReportRange(period, now);
  const ticketAmount = {
    $reduce: {
      input: {
        $cond: [{ $isArray: "$seatName" }, "$seatName", []],
      },
      initialValue: 0,
      in: {
        $add: [
          "$$value",
          {
            $convert: {
              input: "$$this.price",
              to: "double",
              onError: 0,
              onNull: 0,
            },
          },
        ],
      },
    },
  };
  const orderAmount = {
    $convert: {
      input: "$totalAmount",
      to: "double",
      onError: 0,
      onNull: 0,
    },
  };

  const [ticketRows, orderRows, paymentRows] = await Promise.all([
    InforTicket.aggregate(
      makeAggregation(ticketAmount, start, end, { excludeLinkedPayments: true }),
    ),
    Orders.aggregate(
      makeAggregation(orderAmount, start, end, { excludeLinkedPayments: true }),
    ),
    Payments.aggregate(
      makeAggregation(orderAmount, start, end, { statusField: "status" }),
    ),
  ]);
  const rows = [...ticketRows, ...orderRows, ...paymentRows];
  const summary = {
    cash: createTotals(),
    banking: createTotals(),
    total: createTotals(),
  };
  const dailyTotals = new Map();

  for (const row of rows) {
    const { date, channel } = row._id;
    if (!CHANNELS.includes(channel)) continue;

    addRow(summary[channel], row);
    addRow(summary.total, row);

    if (!dailyTotals.has(date)) {
      dailyTotals.set(date, {
        cash: createTotals(),
        banking: createTotals(),
        total: createTotals(),
      });
    }

    const day = dailyTotals.get(date);
    addRow(day[channel], row);
    addRow(day.total, row);
  }

  const lastDate = getLocalDate(now);
  const trend = [];
  for (let date = startDate; date <= lastDate; date = addDays(date, 1)) {
    trend.push({
      date,
      ...(dailyTotals.get(date) || {
        cash: createTotals(),
        banking: createTotals(),
        total: createTotals(),
      }),
    });
  }

  return {
    period,
    timeZone: TIME_ZONE,
    from: start.toISOString(),
    to: end.toISOString(),
    summary,
    trend,
  };
};
