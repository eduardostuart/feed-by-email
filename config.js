module.exports = {
  sengridApiKey: process.env.SENDGRID_API_KEY,
  subscriptionsRepository: process.env.OPML_SUBSCRIPTIONS_REPO,
  subscriptionsFile: (process.env.OPML_SUBSCRIPTIONS_REPO_FILE || 'subscriptions.xml'),
  email: {
    to: process.env.EMAIL_TO,
    from: process.env.EMAIL_FROM,
    subject: process.env.EMAIL_SUBJECT
  },
  feedparser: {
    normalize: true,
    addmeta: true
  }
}
