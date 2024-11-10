// ~/MagicMirror/modules/MMM-RSS-Display/MMM-RSS-Display.js

'use strict';

Module.register('MMM-RSS-Display', {
  // Default module config.
  defaults: {
    feedUrls: [
      {
        id: 'nrk_toppsaker',
        url: 'https://www.nrk.no/toppsaker.rss',
        customTitle: 'NRK',
        customImage: 'modules/MMM-RSS-Display/images/nrk.png',
      },
      {
        id: 'tv2_nyheter',
        url: 'https://www.tv2.no/rss/nyheter',
        customTitle: 'TV2',
        customImage: 'modules/MMM-RSS-Display/images/tv2.png',
      },
      {
        id: 'aftenbladet',
        url: 'https://www.aftenbladet.no/rssrss2/',
        customTitle: 'Stavanger Aftenblad',
        customImage: 'modules/MMM-RSS-Display/images/aftenbladet.png',
        // No customTitle or customImage; defaults will be used
      },
      // Add more RSS feed URLs here
    ],
    maxItems: 80,
    updateInterval: 15 * 60 * 1000, // 15 minutes
    displayInterval: 10 * 1000, // 10 seconds
    titleColor: '#e6e6e6', // Light gray color
    titleFontSize: '1.1em',
    descriptionColor: '#CCCCCC',
    descriptionFontSize: '0.9em',
    fallbackDescription: 'No description available.', // More descriptive fallback

    // Fixed Height Configuration
    fixedHeight: {
      unit: 'percentage', // 'percentage' or 'pixels'
      value: 10, // 10% of screen height or 100 pixels
    },
    // Alignment Configuration
    textAlign: 'top', // 'top', 'center', or 'bottom'
    imageAlignment: 'middle', // 'top', 'middle', 'bottom'
    qrCodeAlignment: 'middle', // 'top', 'middle', 'bottom'

    // Additional Configurations (Optional)
    showQRCode: true,
    showImages: true,
    animationEffect: 'fade', // 'fade', 'slide', 'none'
    defaultImageUrl: 'modules/MMM-RSS-Display/images/default.jpg',
    maxDescriptionLines: 3, // Set desired number of lines
  },

  // Define required styles
  getStyles: function () {
    return ['MMM-RSS-Display.css'];
  },

  // Define required scripts
  getScripts: function () {
    return ['moment.js']; // Ensure moment.js is included if time formatting is used
  },

  // Define additional translations (if any)
  getTranslations: function () {
    return false; // No translations by default
  },

  // Define the start sequence
  start: function () {
    this.items = [];
    this.currentIndex = 0;
    this.titleCache = {};
    this.parsedFeeds = this.config.feedUrls; // Store parsed feeds for reference

    // Debugging log to verify config is received correctly
    console.log('[MMM-RSS-Display] Starting module with config:', this.config);

    // Send the entire config to node_helper.js
    this.sendSocketNotification('FETCH_RSS', this.config);

    // Validate alignment options
    const validAlignments = ['top', 'middle', 'bottom'];
    if (!validAlignments.includes(this.config.imageAlignment)) {
      console.warn(`[MMM-RSS-Display] Invalid imageAlignment: "${this.config.imageAlignment}". Falling back to "top".`);
      this.config.imageAlignment = 'top';
    }

    if (!validAlignments.includes(this.config.qrCodeAlignment)) {
      console.warn(`[MMM-RSS-Display] Invalid qrCodeAlignment: "${this.config.qrCodeAlignment}". Falling back to "top".`);
      this.config.qrCodeAlignment = 'top';
    }

    // Schedule regular RSS updates
    this.updateRSSInterval = setInterval(() => {
      console.log('[MMM-RSS-Display] Fetching RSS feeds...');
      this.sendSocketNotification('FETCH_RSS', this.config); // Send entire config
    }, this.config.updateInterval);
  },

  // Handle received socket notifications
  socketNotificationReceived: function (notification, payload) {
    if (notification === 'RSS_DATA') {
      if (Array.isArray(payload)) {
        this.items = payload;
        console.log(`[MMM-RSS-Display] Received ${this.items.length} RSS items.`);
        this.currentIndex = 0; // Reset index when new data arrives
        this.updateDom(); // Update the DOM immediately
        this.startDisplayCycle(); // Start cycling through items
      } else {
        console.error('[MMM-RSS-Display] Received RSS_DATA payload is not an array.');
      }
    }
  },

  // Helper Function to Format Title
  formatTitle: function (title) {
    if (!title) return '';

    // Check cache first
    if (this.titleCache[title]) {
      return this.titleCache[title];
    }

    const maxLength = 50; // Define what "too long" means
    let formattedTitle = title;

    // Check if title is too long
    if (title.length > maxLength) {
      // Specific punctuations to split after: colon (:), comma (,), period (.)
      const punctuations = [':', ',', '.'];
      let splitIndex = -1;

      // Find the earliest punctuation after the first half of the title
      const halfLength = Math.floor(title.length / 2);
      for (let i = 0; i < punctuations.length; i++) {
        const punct = punctuations[i];
        const index = title.indexOf(punct, halfLength);
        if (index !== -1) {
          splitIndex = index + 1; // Split after the punctuation
          break;
        }
      }

      if (splitIndex === -1) {
        // If no punctuation found after half length, look for any punctuation
        for (let i = 0; i < punctuations.length; i++) {
          const punct = punctuations[i];
          const index = title.indexOf(punct);
          if (index !== -1) {
            splitIndex = index + 1; // Split after the punctuation
            break;
          }
        }
      }

      if (splitIndex !== -1 && splitIndex < title.length) {
        // Ensure not to split in the middle of a word
        // Find the last space before splitIndex
        const lastSpaceBeforeSplit = title.lastIndexOf(' ', splitIndex);
        if (lastSpaceBeforeSplit !== -1) {
          splitIndex = lastSpaceBeforeSplit + 1; // Include the space
        }

        const firstPart = title.substring(0, splitIndex).trim();
        const secondPart = title.substring(splitIndex).trim();

        // Ensure that the split does not break a word
        if (firstPart && secondPart) {
          formattedTitle = `${firstPart}<br>${secondPart}`;
        }
      } else {
        // If no suitable punctuation found, split at the nearest space before the midpoint
        const lastSpaceBeforeHalf = title.lastIndexOf(' ', halfLength);
        if (lastSpaceBeforeHalf !== -1) {
          const firstPart = title.substring(0, lastSpaceBeforeHalf).trim();
          const secondPart = title.substring(lastSpaceBeforeHalf).trim();
          formattedTitle = `${firstPart}<br>${secondPart}`;
        } else {
          // If no spaces found, split into two equal halves
          const mid = Math.floor(title.length / 2);
          const firstPart = title.substring(0, mid).trim();
          const secondPart = title.substring(mid).trim();
          formattedTitle = `${firstPart}<br>${secondPart}`;
        }
      }

      // Check if the second line is less than 10% of the total length
      const totalChars = title.length;
      const secondLineChars = formattedTitle.split('<br>')[1]?.length || 0;
      if (secondLineChars / totalChars < 0.1) {
        // Reduce font size to fit on one line
        const currentFontSize = parseFloat(this.config.titleFontSize);
        const newFontSize = currentFontSize * 0.9;
        formattedTitle = `<span style="font-size: ${newFontSize}em;">${title}</span>`;
      }
    }

    // Cache the formatted title
    this.titleCache[title] = formattedTitle;
    return formattedTitle;
  },

  // Generate the DOM elements for the module
  getDom: function () {
    const wrapper = document.createElement('div');
    wrapper.className = 'rss-container';

    // Set CSS variables based on configuration
    wrapper.style.setProperty('--rss-title-font-size', this.config.titleFontSize);
    wrapper.style.setProperty('--rss-title-color', this.config.titleColor);
    wrapper.style.setProperty('--rss-description-font-size', this.config.descriptionFontSize);
    wrapper.style.setProperty('--rss-description-color', this.config.descriptionColor);
    wrapper.style.setProperty('--max-description-lines', this.config.maxDescriptionLines);

    // Apply Fixed Height
    if (this.config.fixedHeight) {
      if (this.config.fixedHeight.unit === 'percentage') {
        wrapper.style.height = `${this.config.fixedHeight.value}vh`; // vh = viewport height
        console.log(`[MMM-RSS-Display] Set module height to ${this.config.fixedHeight.value}vh`);
      } else if (this.config.fixedHeight.unit === 'pixels') {
        wrapper.style.height = `${this.config.fixedHeight.value}px`;
        console.log(`[MMM-RSS-Display] Set module height to ${this.config.fixedHeight.value}px`);
      }
      wrapper.style.overflow = 'hidden'; // Hide overflow content
    }

    // Apply Text Alignment
    if (this.config.textAlign) {
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      switch (this.config.textAlign) {
        case 'top':
          wrapper.style.justifyContent = 'flex-start';
          console.log(`[MMM-RSS-Display] Set text alignment to top`);
          break;
        case 'center':
          wrapper.style.justifyContent = 'center';
          console.log(`[MMM-RSS-Display] Set text alignment to center`);
          break;
        case 'bottom':
          wrapper.style.justifyContent = 'flex-end';
          console.log(`[MMM-RSS-Display] Set text alignment to bottom`);
          break;
        default:
          wrapper.style.justifyContent = 'flex-start';
          console.log(`[MMM-RSS-Display] Set text alignment to default (top)`);
      }
    }

    if (this.items.length === 0) {
      wrapper.innerHTML = 'No news items available.';
      return wrapper;
    }

    // Ensure currentIndex is within bounds
    if (this.currentIndex >= this.items.length) {
      this.currentIndex = 0;
    }

    const currentItem = this.items[this.currentIndex];
    console.log(`[MMM-RSS-Display] Displaying Item ${this.currentIndex + 1}: "${currentItem.title}"`);

    if (!currentItem) {
      wrapper.innerHTML = 'No valid news item to display.';
      return wrapper;
    }

    const itemElement = document.createElement('div');
    itemElement.className = 'rss-item';

    // Image Section (25%)
    if (this.config.showImages) {
      const imageSection = document.createElement('div');
      // Find the feed based on feedId
      const associatedFeed = this.parsedFeeds.find(feed => feed.id === currentItem.feedId);
      const customImage = associatedFeed ? associatedFeed.customImage : null;

      // Apply alignment class
      imageSection.className = `rss-image image-align-${this.config.imageAlignment}`;

      const img = document.createElement('img');

      // Determine the image source based on desired logic
      if (currentItem.imageUrl) {
        // 1. If RSS article has an image, display it
        img.src = currentItem.imageUrl;
        img.alt = currentItem.title;
        console.log(`[MMM-RSS-Display] Using imageUrl: ${currentItem.imageUrl}`);
      } else if (customImage) {
        // 2. If RSS article has no image, but feed has customImage, display it
        img.src = customImage;
        img.alt = `${associatedFeed.customTitle || 'Feed'} Image`;
        console.log(`[MMM-RSS-Display] Using customImage: ${customImage}`);
      } else if (this.config.defaultImageUrl) {
        // 3. If neither RSS article nor feed has an image, use defaultImageUrl
        img.src = this.config.defaultImageUrl;
        img.alt = 'Default Image';
        console.log(`[MMM-RSS-Display] Using defaultImageUrl: ${this.config.defaultImageUrl}`);
      } else {
        // 4. If no images are available, use a placeholder
        img.src = ''; // Alternatively, set to a transparent pixel or another placeholder
        img.alt = 'No Image Available';
        imageSection.classList.add('placeholder');
        console.log('[MMM-RSS-Display] No image available. Using placeholder.');
      }

      // Set lazy loading
      img.loading = 'lazy';

      // Handle image loading
      img.onload = function () {
        this.classList.add('loaded');
      };
      img.onerror = () => {
        // Arrow function to preserve `this`
        if (currentItem.imageUrl && img.src !== currentItem.imageUrl) {
          // If RSS image fails, try customImage
          if (customImage) {
            console.log(`[MMM-RSS-Display] RSS image failed to load. Falling back to customImage for feed "${associatedFeed.customTitle || 'Unknown'}".`);
            img.src = customImage;
            img.alt = `${associatedFeed.customTitle || 'Feed'} Image`;
          } else if (this.config.defaultImageUrl) {
            // If no customImage, try defaultImageUrl
            console.log(`[MMM-RSS-Display] RSS image failed to load and no customImage available. Falling back to defaultImageUrl.`);
            img.src = this.config.defaultImageUrl;
            img.alt = 'Default Image';
          } else {
            // If defaultImageUrl also fails, use placeholder
            console.log(`[MMM-RSS-Display] All image sources failed. Applying placeholder.`);
            img.src = '';
            imageSection.classList.add('placeholder');
          }
        } else if (!currentItem.imageUrl && customImage && img.src !== customImage) {
          // If using customImage and it fails, fallback to defaultImageUrl
          if (this.config.defaultImageUrl) {
            console.log(`[MMM-RSS-Display] Custom image failed to load. Falling back to defaultImageUrl.`);
            img.src = this.config.defaultImageUrl;
            img.alt = 'Default Image';
          }
        } else {
          // If defaultImageUrl fails or no images, use placeholder
          console.log(`[MMM-RSS-Display] Image failed to load. Applying placeholder.`);
          img.src = '';
          imageSection.classList.add('placeholder');
        }
      };

      imageSection.appendChild(img);
      itemElement.appendChild(imageSection);
    } else {
      // If showImages is false, maintain spacing with a placeholder
      const placeholder = document.createElement('div');
      placeholder.className = 'rss-image placeholder';
      itemElement.appendChild(placeholder);
    }

    // Content Section (60%)
    const contentSection = document.createElement('div');
    contentSection.className = 'rss-content';

    // Top: Source and Time
    const topSection = document.createElement('div');
    topSection.className = 'rss-top';

    const source = document.createElement('span');
    source.className = 'rss-source';
    source.innerText = currentItem.source.title || 'Unknown';

    const time = document.createElement('span');
    time.className = 'rss-time';
    time.innerText = this.getTimeDifference(currentItem.pubDate);

    topSection.appendChild(source);
    topSection.appendChild(time);
    contentSection.appendChild(topSection);

    // Middle: Title
    const titleSection = document.createElement('div');
    titleSection.className = 'rss-title';

    const titleLink = document.createElement('a');
    titleLink.href = currentItem.link || '#';
    titleLink.target = '_blank';
    titleLink.innerHTML = this.formatTitle(currentItem.title || 'No Title'); // Use innerHTML for formatting
    titleLink.setAttribute('aria-label', `Read more about ${currentItem.title || 'this item'}`);
    titleSection.appendChild(titleLink);
    contentSection.appendChild(titleSection);

    // Bottom: Description (Fixed)
    const descSection = document.createElement('div');
    descSection.className = 'rss-description';

    // Apply a fallback class if no description is available
    if (!currentItem.description && this.config.fallbackDescription) {
      descSection.classList.add('fallback');
    }

    descSection.innerText = currentItem.description || this.config.fallbackDescription || '';
    contentSection.appendChild(descSection);

    itemElement.appendChild(contentSection);

    // QR Code Section (15%)
    if (this.config.showQRCode && currentItem.qrCode) {
      const qrSection = document.createElement('div');
      qrSection.className = `rss-qr qr-align-${this.config.qrCodeAlignment}`; // Apply separate alignment class

      const qrImg = document.createElement('img');
      qrImg.src = currentItem.qrCode;
      qrImg.alt = `QR Code linking to ${currentItem.title || 'this item'}`;
      qrImg.setAttribute('aria-label', `QR code linking to ${currentItem.title || 'this item'}`);
      qrImg.loading = 'lazy'; // Set lazy loading

      qrImg.onload = function () {
        this.classList.add('loaded');
      };
      qrImg.onerror = function () {
        console.log(`[MMM-RSS-Display] QR code failed to load for "${currentItem.title || 'this item'}". Applying placeholder.`);
        this.src = ''; // Remove broken QR code
        qrSection.classList.add('placeholder');
      };

      qrSection.appendChild(qrImg);
      itemElement.appendChild(qrSection);
    } else {
      // Placeholder to maintain spacing
      const qrPlaceholder = document.createElement('div');
      qrPlaceholder.className = `rss-qr placeholder qr-align-${this.config.qrCodeAlignment}`; // Apply separate alignment class
      itemElement.appendChild(qrPlaceholder);
    }

    wrapper.appendChild(itemElement);

    // Apply Animation Effects (Optional)
    if (this.config.animationEffect === 'fade') {
      wrapper.classList.add('fade-in');
    } else if (this.config.animationEffect === 'slide') {
      wrapper.classList.add('slide-in');
    }

    return wrapper;
  },

  // Start the display cycle for rotating items
  startDisplayCycle: function () {
    if (this.displayIntervalId) {
      clearInterval(this.displayIntervalId);
    }

    this.displayIntervalId = setInterval(() => {
      if (this.items.length === 0) return;
      this.currentIndex = (this.currentIndex + 1) % this.items.length;
      console.log(`[MMM-RSS-Display] Rotating to Item ${this.currentIndex + 1}`);
      this.updateDom();
    }, this.config.displayInterval);
  },

  // Calculate the time difference between now and the publication date
  getTimeDifference: function (pubDate) {
    try {
      const now = new Date();
      const pub = new Date(pubDate);
      const diffMs = now - pub;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 60) {
        return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
      } else if (diffHours < 48) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      } else {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      }
    } catch (error) {
      console.error('[MMM-RSS-Display] Error calculating time difference:', error);
      return 'Unknown time';
    }
  },

  // Called when the module is hidden
  suspend: function () {
    if (this.displayIntervalId) {
      clearInterval(this.displayIntervalId);
      this.displayIntervalId = null;
      console.log('[MMM-RSS-Display] Suspended display cycle.');
    }
  },

  // Called when the module is shown again
  resume: function () {
    if (this.items.length > 0 && !this.displayIntervalId) {
      this.startDisplayCycle();
      console.log('[MMM-RSS-Display] Resumed display cycle.');
    }
  },
});
