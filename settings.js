// Load saved settings when the page opens
document.addEventListener('DOMContentLoaded', async () => {
    const settings = await chrome.storage.sync.get({
        enableEndscreenTimestamp: true,
        enableEndcardDate: true
    });

    document.getElementById('enableEndscreenTimestamp').checked = settings.enableEndscreenTimestamp;
    document.getElementById('enableEndcardDate').checked = settings.enableEndcardDate;
});

// Save settings when they change
document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', async () => {
        const settings = {
            enableEndscreenTimestamp: document.getElementById('enableEndscreenTimestamp').checked,
            enableEndcardDate: document.getElementById('enableEndcardDate').checked
        };
        
        await chrome.storage.sync.set(settings);
    });
}); 