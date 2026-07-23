/// <reference path="../pb_data/types.d.ts" />
onRecordAfterCreateSuccess((e) => {
  const role = e.record.get("role");
  
  // Only send welcome email for designer and crew roles
  if (role !== "designer" && role !== "crew") {
    e.next();
    return;
  }
  
  const email = e.record.get("email");
  const name = e.record.get("name");
  const password = e.record.get("password");
  const loginLink = "https://yourapp.com/login"; // Update with your actual login URL
  
  const message = new MailerMessage({
    from: {
      address: $app.settings().meta.senderAddress,
      name: $app.settings().meta.senderName
    },
    to: [{ address: email }],
    subject: "Welcome to Our Team!",
    html: `
      <h1>Welcome, ${name}!</h1>
      <p>You have been added to our team as a <strong>${role}</strong>.</p>
      
      <h2>Your Login Credentials</h2>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Password:</strong> ${password}</p>
      
      <h2>Get Started</h2>
      <p>Please log in using the credentials above at the link below:</p>
      <p><a href="${loginLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Login to Your Account</a></p>
      
      <p>If you have any questions, please contact the team.</p>
      <p>Best regards,<br>The Team</p>
    `
  });
  
  $app.newMailClient().send(message);
  e.next();
}, "users");