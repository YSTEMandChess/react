/**
 * Categories Schema
 * 
 * Defines the MongoDB structure for lesson categories.
 * Categories help organize chess lessons into logical groups
 * for easier navigation and content management.
 */

const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const categorySchema = new mongoose.Schema({
  categoryName: {
    type: String,
    required: true,
  },
  catId: {
    type: String,
    required: false,
    unique: true,
  },
});

module.exports = categorys = model("categorys", categorySchema);
