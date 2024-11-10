// ~/MagicMirror/modules/MMM-RSS-Display/node_helper.js

'use strict';

const NodeHelper = require('node_helper');
const Parser = require('rss-parser');
const QRCode = require('qrcode');
const { JSDOM } = require('jsdom');
const DOMPurify = require('dompurify')(new JSDOM().window);

module.exports = NodeHelper.create({
  start: function () {
    console.log('[MMM-RSS-Display] Node helper started.');
    this.parser = new Parser({
      customFields: {
        item: ['dc:creator', 'dc:date'],
      },
    });
    this.qrCache = {}; // Initialize QR code cache
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === 'FETCH_RSS') {
      console.log('[MMM-RSS-Display] Received FETCH_RSS notification.');
      this.fetchFeeds(payload);
    }
  },

  // Helper function to extract image URL from RSS item
  extractImageUrl: function (item) {
    if (item.media && item.media.url) {
      console.log(`[MMM-RSS-Display] Found imageUrl in media: ${item.media.url}`);
      return item.media.url;
    } else if (
      item.enclosure &&
      item.enclosure.url &&
      item.enclosure.type &&
      item.enclosure.type.startsWith('image')
    ) {
      console.log(`[MMM-RSS-Display] Found imageUrl in enclosure: ${item.enclosure.url}`);
      return item.enclosure.url;
    } else if (item.image) {
      console.log(`[MMM-RSS-Display] Found imageUrl in image field: ${item.image}`);
      return item.image;
    }
    //console.log('[MMM-RSS-Display] No imageUrl found in RSS item.');
    return null;
  },

  // Helper function to sanitize and clean description
  sanitizeDescription: function (rawDescription) {
    // Remove all HTML tags to get plain text
    const sanitizedText = DOMPurify.sanitize(rawDescription, { ALLOWED_TAGS: [] });
    //console.log('[MMM-RSS-Display] Sanitized description to plain text.');
    return sanitizedText;
  },

  // Helper function to generate or retrieve QR code
  generateQRCode: async function (link) {
    if (this.qrCache[link]) {
      return this.qrCache[link];
    }
    try {
      const qrOptions = {
        color: {
          dark: '#FFFFFF', // White modules
          light: '#000000', // Black background
        },
      };
      const qrDataURL = await QRCode.toDataURL(link, qrOptions);
      this.qrCache[link] = qrDataURL; // Cache it
      return qrDataURL;
    } catch (error) {
      console.error(`[MMM-RSS-Display] Error generating QR code for link (${link}):`, error);
      return null;
    }
  },

  fetchFeeds: async function (config) {
    console.log('[MMM-RSS-Display] Fetching RSS feeds with config:', config);
    const allItems = [];

    // Validate feedUrls
    if (!config.feedUrls || !Array.isArray(config.feedUrls)) {
      console.error('[MMM-RSS-Display] Invalid feedUrls configuration.');
      return;
    }

    // Use Promise.allSettled for concurrent fetching
    const feedPromises = config.feedUrls.map(async (feed) => {
      try {
        console.log(`[MMM-RSS-Display] Fetching RSS feed: ${feed.url}`);
        const parsedFeed = await this.parser.parseURL(feed.url);
        console.log(`[MMM-RSS-Display] Fetched ${parsedFeed.items.length} items from "${parsedFeed.title}"`);

        return parsedFeed.items.map((item) => {
          // Extract image URL from RSS item
          let imageUrl = this.extractImageUrl(item);

          // Extract and sanitize description
          const rawDescription =
            item.description ||
            item['content:encoded'] ||
            item.content ||
            item.summary ||
            (config.fallbackDescription !== undefined ? config.fallbackDescription : 'No description available.');
          const sanitizedDescription = this.sanitizeDescription(rawDescription);

          // Construct RSS item object with necessary fields
          return {
            feedId: feed.id, // Associate item with feed ID
            title: item.title,
            description: sanitizedDescription,
            link: item.link,
            pubDate: item.pubDate,
            source: {
              title: feed.customTitle || (parsedFeed.title || 'Unknown'),
            },
            imageUrl, // May be null if no image found
            qrCode: null, // To be populated later
          };
        });
      } catch (error) {
        console.error(`[MMM-RSS-Display] Error fetching RSS feed (${feed.url}):`, error);
        return []; // Return empty array on failure
      }
    });

    const feedResults = await Promise.allSettled(feedPromises);
    feedResults.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        allItems.push(...result.value);
      } else {
        console.error(`[MMM-RSS-Display] Failed to fetch feed at index ${idx}:`, result.reason);
      }
    });

    if (allItems.length === 0) {
      console.warn('[MMM-RSS-Display] No RSS items fetched from any feed.');
    }

    // Sort items by publication date descending
    allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    // Limit to a certain number of items
    const limitedItems = allItems.slice(0, config.maxItems || 10);
    console.log(`[MMM-RSS-Display] Total items after limiting: ${limitedItems.length}`);
    console.log(`[MMM-RSS-Display] maxItems set to: ${config.maxItems || 10}`);
    console.log(`[MMM-RSS-Display] fallbackDescription set to: "${config.fallbackDescription || 'No description available.'}"`);

    // Generate QR codes for each item
    const itemsWithQR = await Promise.all(
      limitedItems.map(async (item) => {
        const qrCode = await this.generateQRCode(item.link);
        return { ...item, qrCode };
      })
    );

    // Send the data to the frontend
    this.sendSocketNotification('RSS_DATA', itemsWithQR);
    console.log('[MMM-RSS-Display] RSS data sent to frontend.');
  },
});
