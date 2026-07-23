/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");
  collection.listRule = "@request.auth.role = 'owner'";
  collection.viewRule = "id = @request.auth.id || @request.auth.role = 'owner'";
  collection.createRule = "@request.auth.role = 'owner'";
  collection.updateRule = "id = @request.auth.id || @request.auth.role = 'owner'";
  collection.deleteRule = "@request.auth.role = 'owner'";
  return app.save(collection);
}, (app) => {
  try {
  const collection = app.findCollectionByNameOrId("users");
  // No previous rules to restore
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})