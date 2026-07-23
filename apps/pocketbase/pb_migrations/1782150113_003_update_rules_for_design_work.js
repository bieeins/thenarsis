/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("design_work");
  collection.updateRule = "designer_id = @request.auth.id || @request.auth.role = 'owner'";
  return app.save(collection);
}, (app) => {
  try {
  const collection = app.findCollectionByNameOrId("design_work");
  collection.updateRule = "designer_id = @request.auth.id || @request.auth.role = 'owner'";
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})