/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const records = app.findRecordsByFilter("crew_assignments", "order_id = 'ptlgndwk6rsfa7t'");
  for (const record of records) {
    app.delete(record);
  }
}, (app) => {
  // Rollback: record data not stored, manual restore needed
})