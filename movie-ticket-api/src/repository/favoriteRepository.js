import FavoriteUsers from "../model/favoriteUserModel.js";

export const getByUserId = (userId) => FavoriteUsers.findOne({ user_id: userId });

export const createProfile = (userId) =>
  FavoriteUsers.create({ user_id: userId });

// toggle: dùng update với $push/$pull qua filter, trả doc mới
export const toggleArrayItem = (userId, field, itemId) =>
  FavoriteUsers.findOneAndUpdate(
    { user_id: userId },
    [
      { $set: { [field]: { $cond: [{ $in: [itemId, `$${field}`] }, { $setDifference: [`$${field}`, [itemId]] }, { $concatArrays: [`$${field}`, [itemId]] }] } } },
    ],
    { new: true },
  );

export const addPoints = (userId, points) =>
  FavoriteUsers.findOneAndUpdate(
    { user_id: userId },
    { $inc: { loyaltyPoints: points } },
    { new: true },
  );

export const updateMembershipLevel = (userId, level) =>
  FavoriteUsers.findOneAndUpdate(
    { user_id: userId },
    { $set: { membershipLevel: level } },
    { new: true },
  );