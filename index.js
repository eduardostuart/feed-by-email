require('dotenv').config()

const path = require('path')
const fs = require('fs')
const xml2js = require('xml2js')
const git = require('simple-git/promise')
const RSSParser = require('rss-parser')
const EmailTemplate = require('email-templates')
const nodemailer = require('nodemailer')
const nodemailerSendgrid = require('nodemailer-sendgrid')
const config = require('./config')
const { isYesterday } = require('./utils')

async function subscriptionsUrls () {
  try {
    await git().silent(true).clone(config.subscriptionsRepository, '.subscriptions')
  } catch (e) {}

  const file = path.join(__dirname, '.subscriptions', config.subscriptionsFile)
  const subscriptions = fs.readFileSync(file, 'utf8')
  const { opml } = await xml2js.Parser().parseStringPromise(subscriptions)

  // Parse OPML file, return only urls and remove empty items
  return Array.from(opml.body)
    .map(({ outline }) => outline.map(({ $ }) => $.xmlUrl))
    .flat(1)
    .filter(Boolean)
}

async function sendEmail (feeds) {
  const mailer = new EmailTemplate({
    preview: false,
    send: true,
    message: {
      from: config.email.from
    },
    transport: nodemailer.createTransport(
      nodemailerSendgrid({ apiKey: config.sengridApiKey })
    ),
    views: {
      options: {
        map: {
          html: 'handlebars'
        },
        extension: 'html'
      }
    }
  })

  return mailer.send({
    template: 'daily',
    message: {
      to: config.email.to
    },
    locals: {
      feeds,
      today: (new Date()).toDateString()
    }
  })
}

async function yesterdayFeedItems () {
  const rssParser = new RSSParser()

  const urls = await subscriptionsUrls()
  const promises = urls.map(url => rssParser.parseURL(url))

  return (await Promise.allSettled(promises))
    .filter(response => response.status === 'fulfilled')
    .map(response => {
      const feed = response.value

      const items = feed.items.filter(feedItem => isYesterday(new Date(feedItem.isoDate)))

      if (items.length < 1) {
        return undefined
      }

      return {
        ...feed,
        items
      }
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.title < b.title) { return -1 }
      if (a.title > b.title) { return 1 }
      return 0
    })
}

;(async () => {
  const feeds = await yesterdayFeedItems()
  console.log(JSON.stringify(feeds, null, 2));
  await sendEmail(feeds)
})()
