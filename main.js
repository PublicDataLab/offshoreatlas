(function () {
    const maskScale = d3.scaleLinear()
        .domain([0, 1])
        .range([0, 2]);

    const viewportHeight = window.innerHeight;
    const scrollDistance = viewportHeight * 0.75;

    scrollIt(scrollDistance, 2000);

    let introObserver = enterView({
        selector: '.header__title, .header__text',
        progress: function (el, progress) {
            el.firstElementChild.style.maskImage = `linear-gradient(rgba(0,0,0,${Math.min(1, maskScale(progress))}), rgba(0,0,0,${Math.max(0, maskScale(progress) - 0.5)}))`;
            el.firstElementChild.style.webkitMaskImage = `linear-gradient(rgba(0,0,0,${Math.min(1, maskScale(progress))}), rgba(0,0,0,${Math.max(0, maskScale(progress) - 0.5)}))`;
            el.lastElementChild.style.maskImage = `linear-gradient(rgba(0,0,0,${Math.min(1, maskScale(progress) - 0.5)}), rgba(0,0,0,${Math.max(0, maskScale(progress) - 1)}))`;
            el.lastElementChild.style.webkitMaskImage = `linear-gradient(rgba(0,0,0,${Math.min(1, maskScale(progress) - 0.5)}), rgba(0,0,0,${Math.max(0, maskScale(progress) - 1)}))`;
        },
        offset: 0.35
    });

    let headerObserver = enterView({
        selector: 'header',
        progress: function (el, progress) {
            el.firstElementChild.style.background = `linear-gradient(var(--color-light) ${25 + progress * 50}%, var(--color-secondary) ${62.5 + progress * 28.125}%, var(--color-main) 100%)`;
            el.firstElementChild.style.opacity = Math.max(0, 0.5 - progress * 0.58);
        },
        offset: 1
    });

})();

// code credits to Pawel Grzybek: https://pawelgrzybek.com/page-scroll-in-vanilla-javascript/
function scrollIt(destination, duration, callback) {

    const start = window.pageYOffset;
    const startTime = 'now' in window.performance ? performance.now() : new Date().getTime();

    const documentHeight = Math.max(document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight);
    const windowHeight = window.innerHeight || document.documentElement.clientHeight || document.getElementsByTagName('body')[0].clientHeight;
    const destinationOffset = typeof destination === 'number' ? destination : destination.offsetTop;
    const destinationOffsetToScroll = Math.round(documentHeight - destinationOffset < windowHeight ? documentHeight - windowHeight : destinationOffset);

    if ('requestAnimationFrame' in window === false) {
        window.scroll(0, destinationOffsetToScroll);
        if (callback) {
            callback();
        }
        return;
    }

    function scroll() {
        const now = 'now' in window.performance ? performance.now() : new Date().getTime();
        const time = Math.min(1, ((now - startTime) / duration));
        const timeFunction = easeOutQuart(time);
        window.scroll(0, Math.ceil((timeFunction * (destinationOffsetToScroll - start)) + start));

        if (window.pageYOffset === destinationOffsetToScroll) {
            if (callback) {
                callback();
            }
            return;
        }

        requestAnimationFrame(scroll);
    }

    function easeOutQuart(t) {
        return 1 - (--t) * t * t * t;
    }

    scroll();
}
