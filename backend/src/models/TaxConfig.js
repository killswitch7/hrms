const mongoose = require('mongoose');

const slabSchema = new mongoose.Schema(
  {
    upto: { type: Number, required: true }, // income amount for this slab
    rate: { type: Number, required: true }, // percent (example: 10 for 10%)
  },
  { _id: false }
);

const taxConfigSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'NEPAL_DEFAULT', unique: true },
    slabs: {
      unmarried: { type: [slabSchema], default: [] },
      married: { type: [slabSchema], default: [] },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TaxConfig', taxConfigSchema);

