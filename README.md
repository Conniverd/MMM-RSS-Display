# MMM-RSS-Display
is a customizable MagicMirror² module that fetches and displays RSS feed items with images, titles, descriptions, and QR codes for easy access.

This is 100% coded by chatgpt and made mostly for my use. Theese are the only 3 lines I have written.
I use this on a vertical screen setup (1080x1920), and the module at the bottom, 
I have not tested the modules in any other position.

## Screenshot
<img src="https://github.com/Conniverd/MMM-RSS-Display/blob/9d51a0df97ed40dcc64426e8b8b914a95bb47890/screenshot/screenshot_1.jpg" width="800">
<img src="https://github.com/Conniverd/MMM-RSS-Display/blob/9d51a0df97ed40dcc64426e8b8b914a95bb47890/screenshot/screenshot_2.jpg" width="800">
<img src="https://github.com/Conniverd/MMM-RSS-Display/blob/9d51a0df97ed40dcc64426e8b8b914a95bb47890/screenshot/screenshot_3.jpg" width="800">
<img src="https://github.com/Conniverd/MMM-RSS-Display/blob/9d51a0df97ed40dcc64426e8b8b914a95bb47890/screenshot/screenshot_4.jpg" width="800">


## Concept

This is a sibling module of `[MMM-CalendarExt3](https://github.com/MMRIZE/MMM-CalendarExt3)`. This module is made to be an alternative to my previous module `MMM-CalendarExt2`, especially `daily`, `current` and `upcoming` views.


## Features

- **Multiple RSS Feeds:** Display content from various RSS sources simultaneously.
- **Image Support:** Show images from RSS items with fallback to custom or default images.
- **QR Codes:** Automatically generate QR codes linking to each RSS item's URL.
- **Customizable Appearance:** Configure colors, fonts, alignment, and animations.
- **Plain Text Descriptions:** Sanitizes descriptions to display only text.

## Installation

### Steps

1. **Navigate to Modules Directory:**
   cd ~/MagicMirror/modules

2. **Clone the Repository:**
    git clone https://github.com/Conniverd/MMM-RSS-Display.git

3. **Install Dependencies:**
    cd MMM-RSS-Display
    npm install

4. **Add Images:**
    Place your custom images in the images folder.
    Ensure you have a default.jpg for fallback.

5. **Configure MagicMirror:**

// config.js

		{
		  module: "MMM-RSS-Display",
		  position: "bottom_bar", // Choose desired position
		  config: {
		    feedUrls: [
		        {
		          id: "nrk_toppsaker",
		          url: "https://www.nrk.no/toppsaker.rss",
		          customTitle: "NRK",
		          customImage: "modules/MMM-RSS-Display/images/nrk.png"
		        },
		        {
		          id: "tv2_nyheter",
		          url: "https://www.tv2.no/rss/nyheter",
		          customTitle: "TV2",
		          customImage: "modules/MMM-RSS-Display/images/tv2.png"
		        },
		        {
		          id: "aftenbladet",
		          url: "https://www.aftenbladet.no/rssrss2/",
		          customTitle: "Stavanger Aftenblad",
		          customImage: "modules/MMM-RSS-Display/images/aftenbladet.png"
		        },
		        {
		          id: "aftenposten",
		          url: "https://www.aftenposten.no/rss",
		          customTitle: "Aftenposten",
		          customImage: "modules/MMM-RSS-Display/images/aftenposten.png"
		        },
		        {
		          id: "itavisen",
		          url: "http://www.itavisen.no/rss",
		          customTitle: "Itavisen",
		          customImage: "modules/MMM-RSS-Display/images/itavisen.png"
		        },
		        {
		          id: "adressa",
		          url: "https://www.adressa.no/rss",
		          customTitle: "Adressa",
		          customImage: "modules/MMM-RSS-Display/images/adressa.png" 
		        },
		      // Add more RSS feed URLs here
		    ],
		    maxItems: 100,
		    updateInterval: 15 * 60 * 1000, // 15 minutes
		    displayInterval: 60 * 1000, // 10 seconds (consider increasing to 30s or 60s)
		    titleColor: "#e6e6e6", // Light gray color
		    titleFontSize: "1.1em",
		    descriptionColor: "#CCCCCC",
		    descriptionFontSize: "0.9em",
		    fallbackDescription: "", // More descriptive fallback

		    // Fixed Height Configuration
		    fixedHeight: {
		      unit: "percentage", // "percentage" or "pixels"
		      value: 10, // 30% of screen height or 300 pixels
		    },
		    // Alignment Configuration
		    textAlign: "top", // "top", "center", or "bottom"
		    imageAlignment: "middle", // New option: "top", "middle", "bottom"
  			qrCodeAlignment: "middle", // New option: "top", "middle", "bottom"
		    
		    // Additional Configurations (Optional)
		    showQRCode: true,
		    showImages: true,
		    animationEffect: "fade", // "fade", "slide", "none"
		    defaultImageUrl: "modules/MMM-RSS-Display/images/default.jpg",
		    maxDescriptionLines: 3, // Set desired number of lines
		  },
		},


### Config details
All the properties are omittable, and if omitted, a default value will be applied.

|**property**|**Default**|**Type**|**Description**|
|---|---|---|---|
|`feedUrls`| [] | Array of Objects | Mandatory. List of RSS feeds to display. Each feed object can have the following properties:|
|`feedUrls[].id` |  | String | Mandatory. Unique identifier for the RSS feed. |
|`feedUrls[].url` |  | String | Mandatory. The RSS feed URL. |
|`feedUrls[].customTitle` | Feed's title from RSS feed | String | Optional. Custom title to display for the RSS feed. |
|`feedUrls[].customImage` | default.jpg | String | Optional. Path to a custom image for the RSS feed (relative to the module's images directory). |
|---|---|---|---|
|`maxItems` | 80 | Integer | Optional. Maximum number of RSS items to fetch and display. |
|`updateInterval` | 8900000 (15 minutes) | Integer (ms) | Optional. Interval between RSS feed updates in milliseconds. |
|`displayInterval` | 10000 (10 seconds) | Integer | Optional. Interval between displaying each RSS item in milliseconds. |
|`titleColor` | #e6e6e6 (Light gray) | String (CSS) | Optional. Color of the RSS item titles. |
|`titleFontSize` | 1.1em | String (CSS) | Optional. Font size of the RSS item titles. |
|`descriptionColor` | #CCCCCC | String (CSS) | Optional. Color of the RSS item descriptions. |
|`descriptionFontSize` | 1.1em | String (CSS) | Optional. Font size of the RSS item titles. |
|`titleFontSize` | 0.9em | String (CSS) | Optional. Font size of the RSS item descriptions. |
|`fallbackDescription` | "No description available." | String (CSS) | Optional. Text to display if an RSS item lacks a description. |
|`fixedHeight` | { unit: 'percentage', value: 10 } | Object | Optional. Configuration for the module's fixed height. |
|`fixedHeight.unit` | 'percentage' | String | Optional. Unit for fixed height. Can be 'percentage' or 'pixels'. |
|`fixedHeight.value` | 10 (10% of viewport height) | Integer | Optional. Value for fixed height based on the unit. |
|`textAlign` | 'top' | String | Optional. Vertical alignment of text within the module. Can be 'top', 'center', or 'bottom'. |
|`imageAlignment` | 'middle' | String | Optional. Vertical alignment of images within their container. Can be 'top', 'middle', or 'bottom'. |
|`qrCodeAlignment` | 'middle' | Optional. Vertical alignment of QR codes within their container. Can be 'top', 'middle', or 'bottom'. |
|`showQRCode` | true | Boolean | Optional. Optional. Whether to display QR codes for RSS items. |
|`showImages` | true | 	Optional. Whether to display images for RSS items. |
|`animationEffect` | 'fade' | String | Optional. Animation effect when displaying RSS items. Can be 'fade', 'slide', or 'none' |
|`defaultImageUrl` | 'modules/MMM-RSS-Display/images/default.jpg' | String | Optional. Path to the default image to display when an RSS item lacks an image. (Relative to the module's images directory.) |
|`maxDescriptionLines` | 3 | Integer | Optional. Maximum number of lines to display for descriptions before truncating. |

