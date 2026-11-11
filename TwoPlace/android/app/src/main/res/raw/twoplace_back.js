(function () {
    try {
        if (typeof window.twoPlaceBack === 'function') {
            return window.twoPlaceBack() === false ? 'home' : 'handled';
        }
        return document.readyState === 'complete' ? 'fallback' : 'loading';
    } catch (error) {
        return 'fallback';
    }
})()
