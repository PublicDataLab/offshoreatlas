(function () {
    const maskScale = d3.scaleLinear()
        .domain([0, 1])
        .range([0, 2]);

    // reset scroll on refresh
    window.scroll(0,0);
    // scroll to first headline
    const {top} = document.querySelector(".header__section").getBoundingClientRect()
    window.scrollTo({
        top: top * 0.8,
        behavior: "smooth",
    })

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
