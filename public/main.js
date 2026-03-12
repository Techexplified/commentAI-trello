const ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM0MjUyNmUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCI+PC9jaXJjbGU+PC9zdmc+'; 

window.TrelloPowerUp.initialize({
  
  // 1. The Toggle Button (Using .then() instead of async/await)
  'card-buttons': function(t, options) {
    return t.get('card', 'shared', 'isCommentAIVisible', false)
      .then(function(isVisible) {
        return [{
          icon: ICON,
          text: isVisible ? 'Remove Comment AI' : 'Add Comment AI',
          // The callback CAN be async because it is executed on click, not on render
          callback: async function(t) {
            await t.set('card', 'shared', 'isCommentAIVisible', !isVisible);
            // This forces the card back to refresh so the section shows/hides instantly
            return t.closePopup(); 
          }
        }];
      });
  },

  // 2. The AI Section (Using .then() instead of async/await)
  'card-back-section': function(t, options) {
    return t.get('card', 'shared', 'isCommentAIVisible', false)
      .then(function(isVisible) {
        if (!isVisible) {
          return null; // Hide the section
        }

        return {
          title: 'Comment AI',
          icon: ICON,
          content: {
            type: 'iframe',
            url: t.signUrl('./section.html'),
            height: 400
          },
          action: {
            text: 'Settings',
            callback: function(t) {
              return t.popup({
                title: 'Comment AI Settings',
                url: './settings.html',
                height: 250
              });
            }
          }
        };
      });
  },

  // (Unchanged)
  'show-settings': function(t, options) {
    return t.popup({
      title: 'Comment AI Settings',
      url: './settings.html',
      height: 220
    });
  },

  // (Unchanged)
  'board-buttons': function (t, options) {
    return [{
      icon: ICON,
      text: 'Comment AI',
      callback: function (t) {
        return t.popup({
          title: 'Comment AI Settings',
          url: './settings.html',
          height: 250
        });
      }
    }];
  }
});
