/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("orders");
  collection.listRule = "@request.auth.role = 'owner' || assigned_designer_id = @request.auth.id || @request.auth.role = 'design_reviewer'";
  collection.viewRule = "@request.auth.role = 'owner' || assigned_designer_id = @request.auth.id || @request.auth.role = 'design_reviewer'";
  return app.save(collection);
}, (app) => {
  try {
  const collection = app.findCollectionByNameOrId("orders");
  collection.listRule = "@request.auth.role = 'owner' || assigned_designer_id = @request.auth.id";
  collection.viewRule = "@request.auth.role = 'owner' || assigned_designer_id = @request.auth.id";
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})
