const CONFIG = {
    enableEndscreenTimestamp: true,
    enableEndcardDate: true
};

// Load settings from storage
async function loadConfig() {
    const settings = await chrome.storage.sync.get({
        enableEndscreenTimestamp: true,
        enableEndcardDate: true
    });
    
    Object.assign(CONFIG, settings);
}

/**
 * Adds timestamps to video endscreen elements
 * @returns {boolean} Success status
 */
function addEndscreenTimestamp() {
    const endscreenLinks = document.querySelectorAll('.ytp-videowall-still');
    
    for (const link of endscreenLinks) {
        const ariaLabel = link.getAttribute('aria-label');
        if (!ariaLabel) {
            console.debug('No aria-label found');
            continue;
        }
        
        // Matches patterns like "2 weeks ago" or "5 hours ago" or "3 months ago"
        const timeRegex = /(\d+\s+(?:second|minute|hour|day|week|month|year)[s]?)\s+ago/;
        const match = ariaLabel.match(timeRegex);
        
        if (!match) continue;

        const infoContent = link.querySelector('.ytp-videowall-still-info-content');
        if (!infoContent) {
            console.debug('No info content found');
            continue;
        }

        // Add flex display while preserving existing styles
        infoContent.style.cssText += `
            display: flex;
            flex-direction: column;
        `;

        // Add timestamp if it doesn't exist
        if (!infoContent.querySelector('.ytp-videowall-still-info-postdate')) {
            const timestamp = document.createElement('span');
            timestamp.textContent = match[0];
            timestamp.className = 'ytp-videowall-still-info-postdate';
            infoContent.appendChild(timestamp);
        }
    }

    return true;
}

/**
 * Adds timestamps to video end cards by fetching video metadata
 * @returns {boolean} Success status
 */
function addEndCardTimestamp() {
    // Wait for the end card elements to appear
    const endCardElements = document.querySelectorAll('.ytp-ce-element');

    endCardElements.forEach(async element => {
        const isPlaylist = element.querySelector('.ytp-ce-playlist-title') !== null;
        if (isPlaylist) {
            console.debug('is playlist');
            return false;
        }

        const overlay = element.querySelector('.ytp-ce-covering-overlay');
        if (!overlay) {
            console.debug('no overlay found');
            return false;
        }

        // Extract video URL from href
        const href = overlay.getAttribute('href');
        if (!href) {
            console.debug('no href found');
            return false;
        }

        try {
            // Fetch video page
            const response = await fetch(href);
            const html = await response.text();
            
            // Extract time ago from the JSON data structure
            const timeAgoMatch = html.match(/"relativeDateText":\s*{\s*"accessibility":\s*{\s*"accessibilityData":\s*{\s*"label":\s*"([^"]+)"\s*}\s*}/);
            if (!timeAgoMatch) {
                console.error('no match for time string');
                return false;
            }

            const timeAgo = timeAgoMatch[1].trim();

            // Check if timestamp element already exists
            if (!overlay.querySelector('.ytp-ce-timestamp')) {
                const timestamp = document.createElement('div');
                timestamp.textContent = timeAgo;
                timestamp.className = 'ytp-ce-timestamp';
                overlay.appendChild(timestamp);
            }
            refreshEndCard(overlay);
            return true;

        } catch (error) {
            console.error('Error fetching video page:', error);
        }
        return false;
    });
    return true;
}

/**
 * Refreshes all end cards with updated styling
 * @returns {boolean} Success status
 */
function refreshAllEndCards() {
    const endCardElements = document.querySelectorAll('.ytp-ce-element');

    endCardElements.forEach(element => {
        const overlay = element.querySelector('.ytp-ce-covering-overlay');
        if (!overlay) {
            console.debug('no overlay');
            return false;
        }
        res = refreshEndCard(overlay);

        if (!res) {
            console.debug('no refreshEndCard');
            return false;
        }
    });

    return true;
}

/**
 * Updates the styling of an end card overlay
 * @param {HTMLElement} overlay - The overlay element to refresh
 * @returns {boolean} Success status
 */
function refreshEndCard(overlay) {
    if (!overlay) {
        overlay = document.querySelector('.ytp-ce-covering-overlay');
        if (!overlay) {
            console.debug('No overlay found');
            return false;
        }
    }

    const elements = {
        title: overlay.querySelector('.ytp-ce-video-title'),
        duration: overlay.querySelector('.ytp-ce-video-duration')
    };

    if (!elements.title || !elements.duration) {
        console.debug('Missing required elements');
        return false;
    }

    // Apply styles
    elements.title.style.margin = '0px 0px 1% 0px';
    elements.duration.style.margin = '0';
    
    overlay.style.cssText += `
        margin: 4%;
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        height: auto;
        width: auto;
    `;

    return true;
}

/**
 * Adds date information to end cards and refreshes their styling
 */
function addEndCardDate() {
    if (!addEndCardTimestamp()) {
        console.debug('Unable to add endcard timestamps');
        return;
    }

    if (!refreshAllEndCards()) {
        console.debug('Unable to refresh endcard CSS');
        return;
    }
}

/**
 * Initialize event listeners and start the application
 */
async function main() {
    await loadConfig();
    
    if (CONFIG.enableEndscreenTimestamp) {
        document.addEventListener('yt-autonav-pause-player-ended', addEndscreenTimestamp);
    }
    
    if (CONFIG.enableEndcardDate) {
        const player = document.querySelector('video');
        if (!player) {
            console.error('Video player not found');
            return;
        }
        player.addEventListener('playing', addEndCardDate);
        document.addEventListener('yt-player-updated', addEndCardDate);
    }
}

// Start the application
main();
