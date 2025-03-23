// utils/platformAdapter.js
const formatResponseForPlatform = (response, platform, includeChart = false) => {
    switch (platform) {
      case 'slack':
        return {
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: response
              }
            },
            includeChart ? {
              type: "image",
              title: {
                type: "plain_text",
                text: "Chart"
              },
              image_url: includeChart.url,
              alt_text: "Chart visualization"
            } : null
          ].filter(Boolean)
        };
      
      case 'whatsapp':
        return {
          text: response,
          media: includeChart ? { url: includeChart.url } : null
        };
        
      case 'teams':
        return {
          type: "message",
          attachments: [
            {
              contentType: "application/vnd.microsoft.card.adaptive",
              content: {
                type: "AdaptiveCard",
                body: [
                  {
                    type: "TextBlock",
                    text: response,
                    wrap: true
                  },
                  includeChart ? {
                    type: "Image",
                    url: includeChart.url
                  } : null
                ].filter(Boolean)
              }
            }
          ]
        };
        
      default: // web, email, etc.
        return {
          text: response,
          chart: includeChart
        };
    }
  };