export default class Scrollyteller {
  constructor(chartID) {
    this.parachart = chartID ?
      document.getElementById(chartID)
      : document.querySelector('para-chart-ai');

    // console.warn('this.parachart', this.parachart)

    if (this.parachart) {
      this.init();
    }
  }

  init() {
    this.steps = document.querySelectorAll('[data-para-step]');
    // console.warn('this.steps', this.steps)

    const scroller = new Scrollytelling();

    scroller.setup({
      step: '[data-para-step]',
      offset: 0.5,
      progress: true,
      once: false,
      debug: false,
    });

    scroller.onStepEnter(response => {
      const element = response.element;
      const stepIndex = parseInt(element.dataset.paraStep);
      console.warn('SCROLLER:', response, stepIndex)
      this.activateNextStep(element);
      if (response.action.activate) {
        this.parachart.store.soloSeries = response.action.activate;
      }

      if (response.action.highlight) {
        const highlights = response.action.highlight.replace(/[\[\]']+/g, '').split(',');
        console.warn('response.action.highlight', response.action.highlight)
        console.warn('response.action.highlight highlights', highlights)
        this.parachart.command('click', [`${highlights[0]}`, +highlights[1]]);
      }
    });

    this.steps[0].classList.add('para-active');
    // this.parachart.store.soloSeries = seriesKeys[0];
  }

  activateNextStep(nextStep) {
    this.steps.forEach(step => step.classList.remove('para-active'));
    nextStep.classList.add('para-active');
  }
}

export class Scrollytelling {
  constructor() {
    // callbacks
    this.cb = {
      stepEnter: () => { },
      stepExit: () => { },
      stepProgress: () => { },
    };

    // state
    this.id = this.generateId();
    this.steps = [];
    this.globalOffset = undefined;
    this.containerElement = undefined;
    this.rootElement = null;

    this.progressThreshold = 0;

    this.isEnabled = false;
    this.isProgress = false;
    this.isDebug = false;
    this.isTriggerOnce = false;

    this.exclude = [];

    // scroll direction state
    this.currentScrollY = 0;
    this.comparisonScrollY = 0;
    this.direction = undefined;

    // bound handlers
    this._handleScroll = this._handleScroll.bind(this);
    this._resizeStep = this._resizeStep.bind(this);
    this._intersectStep = this._intersectStep.bind(this);
    this._intersectProgress = this._intersectProgress.bind(this);
  }


  // internal helpers

  selectAll(selector, parent = document) {
    if (typeof selector === 'string') {
      const selectees = Array.from(parent.querySelectorAll(selector));
      // console.warn('selectees', selectees)
      return selectees;
      // return Array.from(parent.querySelectorAll(selector));

    }
    if (selector instanceof Element) return [selector];
    if (selector instanceof NodeList) return Array.from(selector);
    if (Array.isArray(selector)) return selector;
    return [];
  }

  getIndex(node) {
    return +node.getAttribute('data-scrollytelling-index');
  }

  indexSteps(steps) {
    steps.forEach((step) =>
      step.node.setAttribute('data-scrollytelling-index', step.index)
    );
  }

  getOffsetTop(node) {
    const { top } = node.getBoundingClientRect();
    const scrollTop = window.pageYOffset;
    const clientTop = document.body.clientTop || 0;
    return top + scrollTop - clientTop;
  }

  parseOffset(x) {
    if (typeof x === 'string' && x.indexOf('px') > 0) {
      const v = +x.replace('px', '');
      if (!isNaN(v)) return { format: 'pixels', value: v };
      this.err('offset value must be in "px" format. Fallback to 0.5.');
      return { format: 'percent', value: 0.5 };
    } else if (typeof x === 'number' || !isNaN(+x)) {
      if (x > 1) this.err('offset value is greater than 1. Fallback to 1.');
      if (x < 0) this.err('offset value is lower than 0. Fallback to 0.');
      return { format: 'percent', value: Math.min(Math.max(0, x), 1) };
    }
    return null;
  }

  parseAction(action) {
    const actions = {};
    const actionArray = action.split(')');
    actionArray.forEach(actionItem => {
      actionItem = actionItem.trim();
      if (actionItem) {
        const keyValueArray = actionItem.split('(');
        const actionName = keyValueArray[0].trim();
        actions[actionName] = keyValueArray[1].trim();
      }
    }); 
    // console.warn('actions', actions)
    return actions;
  }

  // TODO: remove, unless we really need an ID once Scrollyteller is part of ParaCharts
  generateId() {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    const date = Date.now();
    const result = [];
    for (let i = 0; i < 6; i += 1) {
      const char = alphabet[Math.floor(Math.random() * alphabet.length)];
      result.push(char);
    }
    return `${result.join('')}${date}`;
  }

  err(msg) {
    console.error(`scrollytelling error: ${msg}`);
  }

  createProgressThreshold(height, threshold) {
    const count = Math.ceil(height / threshold);
    const t = [];
    const ratio = 1 / count;
    for (let i = 0; i < count + 1; i += 1) t.push(i * ratio);
    return t;
  }


  // ————— helpers —————
  _resetCallbacksAndExclusions() {
    this.cb = { stepEnter: () => { }, stepExit: () => { }, stepProgress: () => { } };
    this.exclude = [];
  }

  _disconnectObserver({ observers }) {
    Object.keys(observers).forEach((name) => observers[name].disconnect());
  }
  _disconnectObservers() {
    this.steps.forEach((s) => this._disconnectObserver(s));
  }

  _handleEnable(shouldEnable) {
    if (shouldEnable && !this.isEnabled) this._updateObservers();
    if (!shouldEnable && this.isEnabled) this._disconnectObservers();
    this.isEnabled = shouldEnable;
  }

  _notifyProgress(element, progress) {
    const index = this.getIndex(element);
    const step = this.steps[index];
    if (progress !== undefined) step.progress = progress;
    const response = { element, index, progress, direction: this.direction };
    if (step.state === 'enter') this.cb.stepProgress(response);
  }

  _notifyStepEnter(element) {
    const index = this.getIndex(element);
    const step = this.steps[index];
    const response = { element, index, direction: this.direction, action: step.action };

    step.direction = this.direction;
    step.state = 'enter';

    if (!this.exclude[index]) this.cb.stepEnter(response);
    if (this.isTriggerOnce) this.exclude[index] = true;
  }

  _notifyStepExit(element) {
    const index = this.getIndex(element);
    const step = this.steps[index];
    if (!step.state) return false;

    const response = { element, index, direction: this.direction };

    if (this.isProgress) {
      if (this.direction === 'down' && step.progress < 1) this._notifyProgress(element, 1);
      else if (this.direction === 'up' && step.progress > 0) this._notifyProgress(element, 0);
    }

    step.direction = this.direction;
    step.state = 'exit';
    this.cb.stepExit(response);
    return true;
  }

  // ———— scroll tracking ————
  _handleScroll() {
    // window.innerHeight: the height of the visible content
    // document.body.scrollHeight: the total height of the entire content, including both the visible and hidden content
    // window.scrollY: the current vertical scroll position

    const scrollTop = this.containerElement ? this.containerElement.scrollTop : window.pageYOffset;
    // const pageTop = document.body.scrollTop;
    // const pageBottom = document.body.scrollHeight;
    // const currentScroll = window.scrollY + window.innerHeight;
    // let bottomScrollBuffer = 50;


    // console.log('currentScrollY', this.currentScrollY,
    //   '\n scrollY', window.scrollY,
    //   '\n pageTop', pageTop,
    //   '\n pageBottom', pageBottom)

    if (this.currentScrollY !== scrollTop) {
      this.currentScrollY = scrollTop;
      if (this.currentScrollY > this.comparisonScrollY) {
        this.direction = 'down';
      }
      else if (this.currentScrollY < this.comparisonScrollY) {
        this.direction = 'up';
      }
      this.comparisonScrollY = this.currentScrollY;

      // if (this.currentScrollY <= (pageTop + 5)) {
      //   // console.warn('pageTop', 
      //   //   this.steps[0].node
      //   // )
      //   this._notifyStepEnter(this.steps.at(0).node);
      // }
      // else if (currentScroll + bottomScrollBuffer >= pageBottom) {
      //   // console.warn('You are at the bottom!',
      //   //   '\n pageBottom', pageBottom,
      //   //   '\n currentScroll', currentScroll, 
      //   //   this.steps.at(-1).node
      //   // )
      //   this._notifyStepEnter(this.steps.at(-1).node);
      // }
    }
  }

  _setupScrollListener() {
    // Use a single listener on document; adjust direction per event
    document.removeEventListener('scroll', this._handleScroll);
    document.addEventListener('scroll', this._handleScroll, { passive: true });
  }

  // ———— Observer callbacks ————
  _resizeStep([entry]) {
    const index = this.getIndex(entry.target);
    const step = this.steps[index];
    const h = entry.target.offsetHeight;
    if (h !== step.height) {
      step.height = h;
      this._disconnectObserver(step);
      this._updateResizeObserver(step);
      this._updateStepObserver(step);
      if (this.isProgress) this._updateProgressObserver(step);
    }
  }

  _intersectStep([entry]) {
    this._handleScroll(); // update direction
    const { isIntersecting, target } = entry;
    if (isIntersecting) this._notifyStepEnter(target);
    else this._notifyStepExit(target);
  }

  _intersectProgress([entry]) {
    const index = this.getIndex(entry.target);
    const step = this.steps[index];
    const { isIntersecting, intersectionRatio, target } = entry;
    if (isIntersecting && step.state === 'enter') {
      this._notifyProgress(target, intersectionRatio);
    }
  }

  // ———— Observer setup ————
  _updateResizeObserver(step) {
    const observer = new ResizeObserver(this._resizeStep);
    observer.observe(step.node);
    step.observers.resize = observer;
  }
  _updateResizeObservers() {
    this.steps.forEach((s) => this._updateResizeObserver(s));
  }

  _updateStepObserver(step) {
    const h = window.innerHeight;
    const off = step.offset || this.globalOffset;
    const factor = off.format === 'pixels' ? 1 : h;
    const offset = off.value * factor;
    const marginTop = step.height / 2 - offset;
    const marginBottom = step.height / 2 - (h - offset);
    const rootMargin = `${marginTop}px 0px ${marginBottom}px 0px`;
    const root = this.rootElement;

    const threshold = 0.5;
    const options = { rootMargin, threshold, root };
    const observer = new IntersectionObserver(this._intersectStep, options);

    observer.observe(step.node);
    step.observers.step = observer;

    if (this.isDebug) this.updateDebug({ id: this.id, step, marginTop, marginBottom });
  }
  _updateStepObservers() {
    this.steps.forEach((s) => this._updateStepObserver(s));
  }

  _updateProgressObserver(step) {
    const h = window.innerHeight;
    const off = step.offset || this.globalOffset;
    const factor = off.format === 'pixels' ? 1 : h;
    const offset = off.value * factor;
    const marginTop = -offset + step.height;
    const marginBottom = offset - h;
    const rootMargin = `${marginTop}px 0px ${marginBottom}px 0px`;

    const threshold = this.createProgressThreshold(step.height, this.progressThreshold);
    const options = { rootMargin, threshold };
    const observer = new IntersectionObserver(this._intersectProgress, options);

    observer.observe(step.node);
    step.observers.progress = observer;
  }
  _updateProgressObservers() {
    this.steps.forEach((s) => this._updateProgressObserver(s));
  }

  _updateObservers() {
    this._disconnectObservers();
    this._updateResizeObservers();
    this._updateStepObservers();
    if (this.isProgress) this._updateProgressObservers();
  }

  // ———— Public API ————
  setup({
    step,
    parent,
    offset = 0.5,
    threshold = 4,
    progress = false,
    once = false,
    debug = false,
    container = undefined,
    root = null,
    initialIndex,
  }) {
    this._setupScrollListener();

    this.steps = this.selectAll(step, parent).map((node, index) => ({
      index,
      direction: undefined,
      height: node.offsetHeight,
      node,
      observers: {},
      offset: this.parseOffset(node.dataset.offset),
      action: this.parseAction(node.dataset.paraAction),
      top: this.getOffsetTop(node),
      progress: 0,
      state: undefined,
    }));

    console.warn('SCROLLY: this.steps', this.steps);

    if (!this.steps.length) {
      this.err('no step elements');
      return this;
    }

    this.isProgress = progress;
    this.isTriggerOnce = once;
    this.isDebug = debug;
    this.progressThreshold = Math.max(1, +threshold);
    this.globalOffset = this.parseOffset(offset);
    this.containerElement = container;
    this.rootElement = root;

    this._resetCallbacksAndExclusions();
    this.indexSteps(this.steps);
    this._handleEnable(true);
    return this;
  }

  enable() {
    this._handleEnable(true);
    return this;
  }
  disable() {
    this._handleEnable(false);
    return this;
  }
  destroy() {
    this._handleEnable(false);
    this._resetCallbacksAndExclusions();
    document.removeEventListener('scroll', this._handleScroll);
    return this;
  }
  resize() {
    this._updateObservers();
    return this;
  }
  offset(x) {
    if (x === null || x === undefined) return this.globalOffset?.value;
    this.globalOffset = this.parseOffset(x);
    this._updateObservers();
    return this;
  }
  onStepEnter(f) {
    if (typeof f === 'function') this.cb.stepEnter = f;
    else this.err('onStepEnter requires a function');
    return this;
  }
  onStepExit(f) {
    if (typeof f === 'function') this.cb.stepExit = f;
    else this.err('onStepExit requires a function');
    return this;
  }
  onStepProgress(f) {
    if (typeof f === 'function') this.cb.stepProgress = f;
    else this.err('onStepProgress requires a function');
    return this;
  }

  // --- Debug helpers (no-op unless `debug: true`) ---

  updateDebug({ id, step, marginTop }) {
    const { index, height } = step;
    const className = `scrollytelling__debug-step--${id}-${index}`;
    let el = document.querySelector(`.${className}`);
    if (!el) el = this.createDebugEl(className);

    el.style.top = `${marginTop * -1}px`;
    el.style.height = `${height}px`;
    el.querySelector('p').style.top = `${height / 2}px`;
  }

  createDebugEl(className) {
    const el = document.createElement('div');
    el.className = `scrollytelling__debug-step ${className}`;
    el.style.position = 'fixed';
    el.style.left = '0';
    el.style.width = '100%';
    el.style.zIndex = '9999';
    el.style.borderTop = '2px solid black';
    el.style.borderBottom = '2px solid black';

    const p = document.createElement('p');
    p.style.position = 'absolute';
    p.style.left = '0';
    p.style.height = '1px';
    p.style.width = '100%';
    p.style.borderTop = '1px dashed black';

    el.appendChild(p);
    document.body.appendChild(el);
    return el;
  }
}
