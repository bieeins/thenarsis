/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("crew_assignments");
  collection.listRule = "crew_id = @request.auth.id || @request.auth.role = 'owner'";
  collection.updateRule = "crew_id = @request.auth.id || @request.auth.role = 'owner'";
  return app.save(collection);
}, (app) => {
  try {
  const collection = app.findCollectionByNameOrId("crew_assignments");
  collection.listRule = "crew_id = @request.auth.id || @request.auth.role = 'owner'";
  collection.viewRule = "crew_id = @request.auth.id || @request.auth.role = 'owner'";
  collection.updateRule = "crew_id = @request.auth.id || @request.auth.role = 'owner'";
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})