/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const ordersCollection = app.findCollectionByNameOrId("orders");
  ordersCollection.listRule = "@request.auth.role = 'owner' || assigned_designer_id = @request.auth.id || @request.auth.role = 'design_reviewer' || @request.auth.role = 'crew'";
  ordersCollection.viewRule = "@request.auth.role = 'owner' || assigned_designer_id = @request.auth.id || @request.auth.role = 'design_reviewer' || @request.auth.role = 'crew'";
  app.save(ordersCollection);

  const designWorkCollection = app.findCollectionByNameOrId("design_work");
  designWorkCollection.listRule = "designer_id = @request.auth.id || @request.auth.role = 'owner' || @request.auth.role = 'design_reviewer' || @request.auth.role = 'crew'";
  designWorkCollection.viewRule = "designer_id = @request.auth.id || @request.auth.role = 'owner' || @request.auth.role = 'design_reviewer' || @request.auth.role = 'crew'";
  app.save(designWorkCollection);
}, (app) => {
  try {
    const ordersCollection = app.findCollectionByNameOrId("orders");
    ordersCollection.listRule = "@request.auth.role = 'owner' || assigned_designer_id = @request.auth.id || @request.auth.role = 'design_reviewer'";
    ordersCollection.viewRule = "@request.auth.role = 'owner' || assigned_designer_id = @request.auth.id || @request.auth.role = 'design_reviewer'";
    app.save(ordersCollection);

    const designWorkCollection = app.findCollectionByNameOrId("design_work");
    designWorkCollection.listRule = "designer_id = @request.auth.id || @request.auth.role = 'owner' || @request.auth.role = 'design_reviewer'";
    designWorkCollection.viewRule = "designer_id = @request.auth.id || @request.auth.role = 'owner' || @request.auth.role = 'design_reviewer'";
    app.save(designWorkCollection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})
