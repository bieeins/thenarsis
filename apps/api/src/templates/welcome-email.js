export function welcomeEmailTemplate({ name, loginUrl }) {
  return {
    subject: 'Welcome to Thenarsis',
    html: `<p>Hi ${name},</p><p>An account has been created for you on Thenarsis.</p><p>Log in here: <a href="${loginUrl}">${loginUrl}</a></p><p>If you don't know your password, ask the account owner to reset it for you.</p>`,
    text: `Hi ${name}, an account has been created for you on Thenarsis. Log in at ${loginUrl}`,
  };
}
