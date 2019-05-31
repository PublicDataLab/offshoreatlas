(function () {
    const $flowTexts = document.querySelectorAll('.flows__text');
    let timeout0, timeout1, timeout2;

    let flowObserver = enterView({
        selector: '.flows__marker',
        enter: function (el) {
            animateFlow(el.id.replace('flow', 'step'), true);
        },
        exit: function (el) {
            animateFlow(el.id.replace('flow', 'step'), false);
        },
        progress: function(el, progress) {
            let id = el.id.replace(/.*(\d)$/, '$1');
            let $trace = document.querySelector(`.flows__trace .trace__container:nth-child(${id}) .trace`);
            $trace.style.transform = `scaleX(${progress})`;
        },
        offset: 0
    });

    function animateFlow(step, isEntering) {
        // console.log(isEntering ? 'entered ' : 'exited ', step);
        let stepNumber = isEntering ? +step.substring(step.length - 1) : +step.substring(step.length - 1) - 1;
        let $svgLine, $oldAnimationEl, lineStart, lineEnd;

        // Special case for text of step 2
        if (stepNumber === 2) {
            if (isEntering) {
                document.querySelector(`.flows__text span.step2`).classList.add('shown');
            } else {
                $flowTexts.forEach(function (el) { el.classList.remove('shown') });
                document.querySelector(`.flows__text.step1`).classList.add('shown');
                document.querySelector(`.flows__text span.step2`).classList.add('shown');
            }
        } else {
            if (!isEntering && stepNumber === 1) {
                document.querySelector(`.flows__text span.step2`).classList.remove('shown');
            } else {
                $flowTexts.forEach(function (el) { el.classList.remove('shown') });
                document.querySelector(`.flows__text span.step2`).classList.remove('shown');
                // Show a new step only in you are not scrolling back to the begignning beyond the very first step
                if (stepNumber !== 0) {
                    document.querySelector(`.flows__text.step${stepNumber}`).classList.add('shown');
                }
            }
        }

        switch (step) {
            case 'step1':
                animateSvg(step, isEntering);
                break;

            case 'step2':
                animateSvg(step, isEntering);
                break;

            case 'step3':
                document.querySelectorAll('line.step3').forEach(function (line, i) {
                    $oldAnimationEl = line.firstChild;
                    if ($oldAnimationEl != null) {
                        line.removeChild($oldAnimationEl);
                    }
                    lineStart = isEntering ? line.getAttribute('y1') : line.getAttribute('y2');
                    lineEnd = isEntering ? line.getAttribute('y2') : line.getAttribute('y1');
                    animateLine(line, `animationLine3-${i}`, lineStart, lineEnd);
                    if (isEntering) {
                        line.classList.add('shown');
                    } else {
                        if (i === 0) {
                            window.clearTimeout(timeout1);
                            timeout1 = window.setTimeout(function () {
                                line.classList.remove('shown');
                            }, 450);
                        } else {
                            window.clearTimeout(timeout2);
                            timeout2 = window.setTimeout(function () {
                                line.classList.remove('shown');
                            }, 450);
                        }
                    }
                });
                $svgLine = document.querySelector('line.step2');
                $oldAnimationEl = $svgLine.firstChild;
                if ($oldAnimationEl != null) {
                    $svgLine.removeChild($oldAnimationEl);
                }
                lineStart = isEntering ? $svgLine.getAttribute('data-middley2') : $svgLine.getAttribute('data-finaly2');
                lineEnd = isEntering ? $svgLine.getAttribute('data-finaly2') : $svgLine.getAttribute('data-middley2');
                animateLine($svgLine, 'animationLine2', lineStart, lineEnd);
                $svgLine.setAttribute('y2', lineEnd);
                if (isEntering) {
                    document.querySelector('path.step2').classList.add('faded');
                    window.clearTimeout(timeout0);
                    timeout0 = window.setTimeout(function () {
                        document.querySelectorAll('path.step3, text.step3').forEach(function (el) { el.classList.add('shown') });
                    }, 300);
                } else {
                    document.querySelectorAll('path.step3, text.step3').forEach(function (el) { el.classList.remove('shown') });
                    window.clearTimeout(timeout0);
                    timeout0 = window.setTimeout(function () {
                        document.querySelector('path.step2').classList.remove('faded');
                    }, 800);
                }
                break;

            case 'step4':
                animateSvg(step, isEntering);
                break;

            case 'step5':
                if (isEntering) {
                    document.querySelectorAll('.links-top path').forEach(function (el) { el.classList.add('shown') });
                    document.querySelectorAll('.links path').forEach(function (el) { el.classList.add('blurred') });
                } else {
                    document.querySelectorAll('.links-top path').forEach(function (el) { el.classList.remove('shown') });
                    document.querySelectorAll('.links path').forEach(function (el) { el.classList.remove('blurred') });
                }
                break;

            default:
                break;
        }
    }

    function animateSvg(step, isEntering) {
        let stepNumber = step.substring(step.length - 1);
        let $svgLine = document.querySelector(`line.${step}`);
        let $oldAnimationEl = $svgLine.firstChild;
        if ($oldAnimationEl != null) {
            $svgLine.removeChild($oldAnimationEl);
        }
        lineStart = isEntering ? $svgLine.getAttribute('y1') : $svgLine.getAttribute('y2');
        lineEnd = isEntering ? $svgLine.getAttribute('y2') : $svgLine.getAttribute('y1');
        animateLine($svgLine, `animationLine${stepNumber}`, lineStart, lineEnd);
        if (isEntering) {
            document.querySelectorAll(`path.${step}, text.${step}`).forEach(function (el) { el.classList.add('shown') });
            $svgLine.classList.add('shown');
        } else {
            document.querySelectorAll(`path.${step}, text.${step}`).forEach(function (el) { el.classList.remove('shown') });
            window.clearTimeout(timeout0);
            timeout0 = window.setTimeout(function () {
                $svgLine.classList.remove('shown');
            }, 450);
        }
    }


})();

function animateLine(parent, id, start, end) {
    let $newAnimationEl = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
    $newAnimationEl.setAttribute('id', id);
    $newAnimationEl.setAttribute('attributeType', 'XML');
    $newAnimationEl.setAttribute('attributeName', 'y2');
    $newAnimationEl.setAttribute('dur', '0.5s');
    $newAnimationEl.setAttribute('repeatCount', '1');
    $newAnimationEl.setAttribute('from', start);
    $newAnimationEl.setAttribute('to', end);
    parent.appendChild($newAnimationEl);
    document.getElementById(id).beginElement();
}