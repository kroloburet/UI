/**
 * Суперклас UI
 * see documentation https://kroloburet.github.io/UI
 *
 * Copyright (c) Serhii Nyzhnyk. Contacts: <kroloburet@gmail.com>
 * License: http://opensource.org/licenses/MIT
 */
const UI = new class {

    /***************************************
     * Constructor
     **************************************/

    constructor() {
        this.#datasetMethodRegister([
            {attributeName: `data-toggle`, methodName: `Toggle`, event: `click`},
            {attributeName: `data-go-to`, methodName: `GoTo`, event: `click`},
            {attributeName: `data-hint`, methodName: `Hint`, event: `mouseover`},
            {attributeName: `data-popup`, methodName: `Popup`, event: `click`},
            {attributeName: `data-lim`, methodName: `Lim`, event: `input`},
        ]);
    }

    /***************************************
     * Private UI fields
     **************************************/

    /**
     * UI не буде опрацьовувати елементи з цими
     * селекторами та їх дочірніми елементами
     *
     * @type {Array}
     * @private
     * @see https://kroloburet.github.io/UI/#disabledNodes
     */
    #disabledNodes = [`.UI_disabled-node`];

    /**
     * Методи UI можуть використовувати черги
     *
     * @type Object
     * @private
     * @type {{stack: {}, run(string): Promise<void>, push(Function, Object, string): void}}
     */
    #queue = {
        stack: {},

        /**
         * Додає нове завдання до черги по вказаному ключу
         * @param {Function} callback async функція, яку слід виконати
         * @param {Object} args Аргументи для функції
         * @param {string} key Ключ, що визначає простір імен
         */
        push(callback, args, key) {
            if (!this.stack[key]) {
                this.stack[key] = [];
            }
            this.stack[key].push({ callback, args });
            if (this.stack[key].length === 1) {
                this.run(key);
            }
        },

        /**
         * Виконує всі завдання в черзі для певного ключа
         * @param {string} key Ключ, що визначає простір імен
         */
        async run(key) {
            while (this.stack[key] && this.stack[key].length > 0) {
                const { callback, args } = this.stack[key][0];
                await callback(args);
                this.stack[key].shift();
            }
            if (this.stack[key] && this.stack[key].length === 0) {
                delete this.stack[key];
            }
        }
    }

    /**
     * Чи є елемент нащадком забороненого
     * вузла, або сам заборонений
     *
     * @param {HTMLElement} el Елемент що перевіряється
     * @return {boolean}
     * @private
     */
    #isDisabledNode(el = null) {
        if (!el) {
            if ((event instanceof Event) && (event.currentTarget instanceof Element)) el = event.currentTarget;
        } else {
            return this.#disabledNodes.some(selector => {
                let find = el.closest(selector);
                if (find) {
                    let entity = find === el ? `node` : `element`;
                    console.warn(`UI found disabled ${entity}:\n`, el, `\nSee: ${origin}/UI/#disabledNodes`);
                }
                return find;
            });
        }
    }

    /**
     * Встановити мітку активації метода UI на елементі
     * та генерувати подію
     *
     * @event UI.activated
     *
     * @param {HTMLElement} el Елемент на якому встановлюється мітка
     * @param {string} selfName Ім'я метода
     * @private
     */
    #markActivate(el, selfName) {
        el.classList.add(`UI_${selfName}-activated`);
        el.dispatchEvent(new CustomEvent(`UI.activated`));
    }

    /**
     * Видалити мітку активації метода UI на елементі
     * разом з динамічно створеними CSS-класами,
     * генерувати подію
     *
     * @event UI.unactivated
     *
     * @param {HTMLElement} el Елемент в якому видалятиметься мітка
     * @param {string} selfName Ім'я метода
     * @private
     */
    #unmarkActivate(el, selfName) {
        el.querySelectorAll(`:scope [class^=UI_${selfName}]`).forEach(child => {
            let list = [...child.classList].filter(cssClass => new RegExp(`UI_${selfName}`).test(cssClass));
            child.classList.remove(...list);
            if (!child.className) child.removeAttribute(`class`);
        });
        el.classList.remove(`UI_${selfName}-activated`);
        el.dispatchEvent(new CustomEvent(`UI.unactivated`));
    }

    /**
     * Перевірка мітки активації метода UI на елементі
     *
     * @param {HTMLElement} el Елемент що перевіряється
     * @param {string} selfName Ім'я метода
     * @return {boolean}
     * @private
     */
    #isActivate(el, selfName) {
        return el.classList.contains(`UI_${selfName}-activated`);
    }

    /**
     * Реєстрація методів UI що працюватимуть через атрибути "data-"
     *
     * @param {[{attributeName: `data-method`, methodName: `Method`, event: `click`}]} registerData Масив даних реєстрації
     * @private
     */
    #datasetMethodRegister(registerData) {
        // Отримати параметри для метода UI зі значення атрибута "data-method"
        const getDatasetMethodParams = (el, val) => {
            let formatParam = param => {
                param = param.trim();
                const lowerCaseParam = param.toLowerCase();
                const intParam = parseInt(param, 10);
                const isSpecial = [`true`, `false`, `null`, `undefined`].includes(lowerCaseParam);
                if (isSpecial) return JSON.parse(lowerCaseParam);
                if (lowerCaseParam === `this`) return el;
                if (!isNaN(intParam)) return intParam;
                return param;
            };
            return val.split(`,`).map(formatParam);
        }
        // Опрацювати масив даних
        registerData.forEach(data => {
            document.addEventListener(data.event, e => {
                const el = e.target.closest(`[${data.attributeName}]`);
                if (!el) return;
                const methodParams = el.getAttribute(data.attributeName);
                if (data.methodName in this && methodParams) {
                    this[data.methodName].trigger = el;
                    this[data.methodName](...getDatasetMethodParams(el, methodParams));
                }
            });
        });
    }

    /**
     * Отримати конфігурацію метода з атрибутів "data-" елемента
     *
     * @param {HTMLElement} el Цільовий елемент
     * @returns {Object}
     */
    #getDatasetConf(el) {
        const conf = {...el.dataset};
        const dict = {
            "true": true,
            "false": false,
        };
        for (let i in conf) {
            if (i === `selector`) {
                delete conf[i];
                continue;
            }
            let val = conf[i].toLowerCase();
            if (val in dict) conf[i] = dict[val];
        }
        return conf;
    }

    /**
     * Робота з компонентами форми
     *
     * @type {Object}
     * @private
     */
    #formComponent = {

        /**
         * Обгорнути елемент форми в компонент
         * та призначити компоненту CSS класи елемента
         *
         * @param {HTMLElement} el Елемент форми
         * @returns {HTMLElement} Компонент
         */
        wrap(el) {
            const denyClasses = [
                UI.css.InputFile,
                UI.css.InputRange,
                UI.css.InputNumber,
                UI.css.Select,
                UI.css.UI_range,
                UI.css.UI_select,
                UI.css.UI_input,
                UI.css.UI_textarea,
            ];
            const className = el.className;
            const component = document.createElement('label');
            const componentClassList = [...el.classList].filter(item => !denyClasses.includes(item));
            el.UI ??= {};
            el.UI.oldClasses = className;
            el.classList.remove(...componentClassList);
            component.classList.add(UI.css.formComponent, ...componentClassList);
            el.before(component);
            component.append(el);
            return component;
        },

        /**
         * Видалити "обгортку" компонента форми
         * та повернути елементу початкові CSS класи
         *
         * @param {HTMLElement} el Елемент форми
         */
        unwrap(el) {
            el.className = el.UI.oldClasses;
            el.UI.component.before(el);
            el.UI.component.remove();
        },
    }

    /***************************************
     * Public UI fields
     **************************************/

    /**
     * CSS селектори з файлу UI.css для використання в сценаріях
     *
     * @type {Object}
     * @see https://kroloburet.github.io/UI/#cssSelectorsInJs
     */
    css = {
        elementsOverlayZIndex: getComputedStyle(document.body).getPropertyValue(`--UI_base-overlay-elements-z-index`),
        bodyOverlayZIndex: getComputedStyle(document.body).getPropertyValue(`--UI_base-overlay-body-z-index`),
        bodyOverlay: `UI_body-overlay`,
        bodyHideOverflow: `UI_body-hide-overflow`,
        scrollbar: `UI_scrollbar`,
        noScrollbar: `UI_no-scrollbar`,
        process: `UI_process`,
        disabled: `UI_disabled`,
        invalidForm: `UI_invalid-form`,
        focusForm: `UI_focus-form`,
        requiredForm: `UI_required-form`,
        readonlyForm: `UI_readonly-form`,
        disabledForm: `UI_disabled-form`,
        formComponent: `UI_form-component`,
        formComponentControl: `UI_form-component-control`,
        InputFile: `UI_InputFile`,
        InputRange: `UI_InputRange`,
        InputNumber: `UI_InputNumber`,
        Select: `UI_Select`,
        UI_range: `UI_range`,
        UI_select: `UI_select`,
        UI_input: `UI_input`,
        UI_textarea: `UI_textarea`,
        angleUp: `UI_angle-up`,
        angleDown: `UI_angle-down`,
    }

    /**
     * Визначення ширин пристроїв
     *
     * @type {Object}
     */
    breakpoints = {
        deviceXS: 350, // phones
        deviceS: 576, // phones
        deviceM: 768, // tablets
        deviceL: 992, // laptops
        deviceXL: 1200, // desktops
    }

    /**
     * Інтерфейс перемикання контенту (таби)
     *
     * @event UI.activated
     * @event UI.unactivated
     * @event UI.beforeRemove
     * @event UI.removed
     * @event UI.beforeShow event.detail = {tabIndex: int}
     * @event UI.showed event.detail = {tabIndex: int}
     *
     * @param {Object} userConf Конфігурація користувача
     * @param {string} [userConf.selector = `UI_Tabs`] Селектор dl елемента/тів для опрацювання
     * @param {number} [userConf.showTabIndex = 0] Індекс вкладки, яку потрібно відкрити за замовчуванням
     * @param {boolean} [userConf.smartShow = true] Дозволено чи ні за замовчуванням відкривати вкладку, передану в рядку uri
     * @returns {Object} Клас-будівельник
     * @see https://kroloburet.github.io/UI/#tabs
     */
    Tabs(userConf = {}) {
        // Ім'я методу
        const selfName = `Tabs`;

        // CSS селектори які використовує метод
        const css = {
            control: `UI_${selfName}-control`,
            show: `UI_${selfName}-show`,
        };

        // Конфігурація за замовчуванням
        const defConf = {
            selector: `.UI_${selfName}`,
            showTabIndex: 0,
            smartShow: true,
        };

        // Селектор пошуку елементів для опрацювання
        const selector = userConf.selector ?? defConf.selector;

        // Колекція елементів для опрацювання
        const collection = [...document.querySelectorAll(selector)]
            .filter(el => el.tagName === `DL` && !UI.#isDisabledNode(el));

        return new class {
            constructor() {
                this.#activate();
            }

            /**
             * Опрацювати неактивовані елементи колекції
             *
             * @returns {this}
             * @private
             */
            #activate() {
                // Отримати з uri хешу дані про id табів та індекси вкладок які потрібно відкрити
                // Приклад: example.com#tabsId1=2&tabsId2=3
                const smartSowTabs = {};
                location.hash.replace(/^#/, ``).split(`&`).forEach(item => {
                    const target = item.split(`=`, 2);
                    target[1] = parseInt(target[1], 10);
                    if (!target[0] || isNaN(target[1])) return;
                    smartSowTabs[target[0]] = target[1];
                });
                // Деактивувати активовані, щоб оновити конфігурацію
                this.remove();
                // Активувати колекцію
                collection.forEach(dl => {
                    // Об'єкт з публічними полями елемента колекції
                    dl.UI = {};
                    dl.UI.conf = Object.assign({}, defConf, userConf, UI.#getDatasetConf(dl));
                    dl.UI.component = dl;
                    dl.UI.control = document.createElement(`div`);
                    dl.UI.tabsList = dl.querySelectorAll(`:scope dt`);
                    dl.UI.contentsList = dl.querySelectorAll(`:scope dd`);
                    // Додати елементи, класи та слухачів подій
                    dl.UI.control.classList.add(css.control, UI.css.noScrollbar);
                    dl.UI.control.append(...dl.UI.tabsList);
                    dl.UI.component.prepend(dl.UI.control);
                    dl.UI.tabsList.forEach(
                        (dt, index) => dt.onclick = () => this.show(index, dl)
                    );
                    // Відкрити вкладку по хешу в uri чи зазначену в конфігурації
                    let showTabIndex = dl.UI.conf.showTabIndex;
                    if (dl.UI.conf.smartShow && dl.UI.component.id && Object.keys(smartSowTabs).length) {
                        if (smartSowTabs[dl.UI.component.id]) {
                            showTabIndex = smartSowTabs[dl.UI.component.id];
                        }
                    }
                    this.show(showTabIndex, dl);
                    // Помітити елемент як активований
                    UI.#markActivate(dl, selfName);
                });
                return this;
            }

            /**
             * Відкрити вкладку за індексом
             *
             * @param {number} tabIndex Індекс вкладки
             * @param {HTMLElement|null} tabs Компонент
             * @returns {this}
             */
            show(tabIndex, tabs = null) {
                const worker = tabs => {
                    // Закрити всі вкладки
                    tabs.UI.tabsList.forEach((dt, index) => {
                        if (dt.classList.contains(css.show)) {
                            tabs.UI.tabsList[index].classList.remove(css.show);
                            tabs.UI.contentsList[index].classList.remove(css.show);
                        }
                    });
                    tabs.dispatchEvent(new CustomEvent(`UI.beforeShow`, {detail: {tabIndex}}));
                    // Перевірити, чи існує вкладка за індексом та відкрити
                    tabIndex = tabs.UI.tabsList[tabIndex]
                        ? tabIndex
                        : (tabs.UI.tabsList[tabs.UI.conf.showTabIndex] ? tabs.UI.conf.showTabIndex : 0);
                    tabs.UI.tabsList[tabIndex].classList.add(css.show);
                    tabs.UI.contentsList[tabIndex].classList.add(css.show);
                    tabs.dispatchEvent(new CustomEvent(`UI.sowed`, {detail: {tabIndex}}));
                };
                // Опрацювати всю колекцію якщо компонент не передано
                !(tabs instanceof HTMLElement) ? collection.forEach(worker) : worker(tabs);
                return this;
            }

            /**
             * Деактивувати активовані елементи колекції
             *
             * @return {this}
             */
            remove() {
                collection.filter(el => UI.#isActivate(el, selfName)).forEach(tabs => {
                    tabs.dispatchEvent(new CustomEvent(`UI.beforeRemove`));
                    // Видалити прив'язку подій та повернути HTML-структуру списку визначень
                    tabs.UI.tabsList.forEach((dt, index) => {
                        dt.onclick = null;
                        tabs.UI.contentsList[index].before(dt);
                    });
                    tabs.UI.control.remove();
                    UI.#unmarkActivate(tabs, selfName);
                    delete tabs.UI;
                    tabs.dispatchEvent(new CustomEvent(`UI.removed`));
                });
                return this;
            }

            /**
             * Отримати активовані елементи колекції
             *
             * @returns {Array}
             */
            get get() {
                return collection.filter(el => UI.#isActivate(el, selfName));
            }
        }
    }

    /**
     * Перемикання відображення елемента
     *
     * @event UI.beforeShow
     * @event UI.showed
     * @event UI.beforeHide
     * @event UI.hidden
     *
     * @param {string|HTMLElement} target Елемент який треба перемикати
     * @param {string} [display = `block`] Значення CSS-властивості display видимого елемента
     * @return {undefined|HTMLElement} Елемент
     * @see https://kroloburet.github.io/UI/#toggle
     */
    Toggle(target, display = `block`) {
        if (this.#isDisabledNode()) return;
        const el = (target instanceof HTMLElement) ? target : document.getElementById(target);
        if (!el) throw ReferenceError(`Element with id "${target}" not found.`);
        // Обробка відображення/приховування
        const visible = el.style.display || getComputedStyle(el, null).getPropertyValue('display');
        if (visible === `none` || el.hidden) {
            el.dispatchEvent(new CustomEvent(`UI.beforeShow`));
            if (this.Toggle.trigger?.classList.contains(UI.css.angleDown))
                this.Toggle.trigger.classList.add(UI.css.angleUp);
            el.style.display = display;
            el.hidden = false;
            el.dispatchEvent(new CustomEvent(`UI.showed`));
        } else {
            el.dispatchEvent(new CustomEvent(`UI.beforeHide`));
            if (this.Toggle.trigger?.classList.contains(UI.css.angleUp))
                this.Toggle.trigger.classList.remove(UI.css.angleUp);
            el.style.display = `none`;
            el.dispatchEvent(new CustomEvent(`UI.hidden`));
        }
        return el;
    }

    /**
     * Перехід до елементу
     *
     * @event UI.beforeGoTo
     * @event UI.afterGoTo
     *
     * @param {string|HTMLElement|null} [target = null] Селектор елемента чи елемент
     * @return {undefined|HTMLElement} Елемент
     * @see https://kroloburet.github.io/UI/#goTo
     */
    GoTo(target = null){
        target = target ?? location.hash;
        if (!target) return;

        const el = target instanceof HTMLElement ? target : document.querySelector(target);
        if (!el) return;

        const getScrollableParent = (element) => {
            let parent = element.parentNode;

            while (parent && parent !== document.body) {
                const overflowY = window.getComputedStyle(parent).overflowY;
                if (overflowY === 'auto' || overflowY === 'scroll') {
                    return parent;
                }
                parent = parent.parentNode;
            }

            return window;
        };

        document.dispatchEvent(new CustomEvent('UI.beforeGoTo'));

        const scrollableParent = getScrollableParent(el);
        const elementPosition = el.getBoundingClientRect();
        const parentPosition = scrollableParent === window ? { top: 0, left: 0 } : scrollableParent.getBoundingClientRect();

        const scrollTop = elementPosition.top - parentPosition.top + scrollableParent.scrollTop - 100; // Корекція відступу
        const scrollLeft = elementPosition.left - parentPosition.left + scrollableParent.scrollLeft;

        scrollableParent.scrollTo({
            top: scrollTop,
            left: scrollLeft,
            behavior: 'smooth',
        });

        document.dispatchEvent(new CustomEvent('UI.afterGoTo'));
        return el;
    }

    /**
     * Підказка що випливає
     *
     * @event UI.beforeShow
     * @event UI.showed
     * @event UI.beforeHide
     * @event UI.hidden
     *
     * @param {HTMLElement} el Елемент на якому буде викликано метод
     * @param {string} [hideEvent = `mouseout`] Подія, що приховує підказку
     * @return {Object} Клас-будівельник
     * @see https://kroloburet.github.io/UI/#hint
     */
    Hint(el, hideEvent = `mouseout`) {
        // Ім'я методу
        const selfName = `Hint`;

        // CSS селектори які використовує метод
        const css = {
            show: `UI_${selfName}-show`,
        };

        return new class {
            constructor() {
                this.#activate();
            }

            /**
             * Визначити підказку та слухачі подій.
             * Якщо вже визначені -- опрацьовувати.
             *
             * @returns {undefined|this}
             * @private
             */
            #activate() {
                if (UI.#isDisabledNode(el)) return;
                if (!el.UI) {
                    if (!el.nextElementSibling.classList.contains(`UI_${selfName}`))
                        throw ReferenceError(`Hint element mast contain css class "UI_${selfName}"!`);
                    el.UI = {};
                    el.UI.hint = el.nextElementSibling;
                    el.addEventListener(`mousemove`, this.setPosition);
                    document.addEventListener(hideEvent, event => {
                        if (event.type === `click` && event.target === el) return;
                        this.hide();
                    });
                }
                this.show();
                return this;
            }

            /**
             * Визначити розташування підказки
             *
             * @param {Event|HTMLElement} e Екземпляр події або елемент
             * @returns {this}
             */
            setPosition(e) {
                const gap = 16;
                const win = window;
                const rect = el.offsetParent.getBoundingClientRect();
                const offsetParentCursorPos = {x: e.clientX - rect.left, y: e.clientY - rect.top};
                const winCursorPos = {x: e.pageX, y: e.pageY};
                const hintWidth = el.UI.hint.offsetWidth;
                const hintHeight = el.UI.hint.offsetHeight;
                // Відстань курсора до правого та нижнього краю вікна
                const distance = {
                    right: win.innerWidth - (winCursorPos.x - win.scrollX),
                    bottom: win.innerHeight - (winCursorPos.y - win.scrollY)
                };
                // Розмістити зліва від курсора, якщо близько до правого краю
                el.UI.hint.style.left = distance.right < hintWidth
                    ? (winCursorPos.x - hintWidth) < 0
                        ? 0 // Закріпити з лівого краю, якщо значення від'ємне
                        : `${offsetParentCursorPos.x - hintWidth}px`
                    : `${offsetParentCursorPos.x + gap}px`;
                // Розмістити над курсором, якщо близько до нижнього краю
                el.UI.hint.style.top = distance.bottom < (hintHeight + gap)
                    ? `${(offsetParentCursorPos.y - gap) - hintHeight}px`
                    : `${offsetParentCursorPos.y + gap}px`;
                return this;
            }

            /**
             * Показати підказку
             *
             * @returns {this}
             */
            show() {
                el.dispatchEvent(new CustomEvent(`UI.beforeShow`));
                el.UI.hint.classList.add(css.show);
                el.dispatchEvent(new CustomEvent(`UI.showed`));
                return this;
            }

            /**
             * Сховати підказку
             *
             * @returns {this}
             */
            hide() {
                el.dispatchEvent(new CustomEvent(`UI.beforeHide`));
                el.UI.hint.classList.remove(css.show);
                el.dispatchEvent(new CustomEvent(`UI.hidden`));
                return this;
            }

            /**
             * Видалити дані метода
             *
             * @returns {this}
             */
            remove() {
                delete el.UI;
                return this;
            }

            /**
             * Отримати елемент що опрацьовується
             *
             * @returns {HTMLElement}
             */
            get get() {
                return el
            }
        }
    }

    /**
     * Повідомлення
     *
     * @event UI.created
     * @event UI.activated
     * @event UI.beforeInsert
     * @event UI.inserted
     * @event UI.beforeRemove
     * @event UI.removed
     *
     * @param {Object} userConf Конфігурація користувача
     * @param {string} [userConf.message = `processing...`] Текст/HTML повідомлення
     * @param {string} [userConf.className = `UI_notice-process`] CSS-клас який буде застосовано до елемента підказки
     * @param {number|null} [userConf.delay = null] Скільки мілісекунд буде показане повідомлення перед тим, як зникне
     * @param {function|null} [userConf.callback = null] Функція, яка буде викликана після того, як час delay сплине
     * @return {Object} Клас-будівельник
     * @see https://kroloburet.github.io/UI/#notice
     */
    Notice(userConf = {}) {
        // Ім'я методу
        const selfName = `Notice`;

        // CSS селектори які використовує метод
        const css = {
            box: `UI_${selfName}-box`,
        };

        // Конфігурація за замовчуванням
        const defConf = {
            message: `processing...`,
            className: `UI_notice-process`,
            delay: null,
            callback: null,
        };

        // Обіцянка для метода UI.Notice().remove()
        let resolveRemovePromise;
        const removePromise = new Promise((resolve) => {
            resolveRemovePromise = resolve;
        });

        // Повідомдення повинні створюватись по черзі
        this.#queue.push(async (config) => {
            const conf = Object.assign({}, defConf, config);

            // Створення нового повідомлення
            this.notice = document.createElement(`div`);
            this.notice.classList.add(`UI_${selfName}`, conf.className);
            this.notice.innerHTML = conf.message;
            this.notice.UI = {};
            this.notice.UI.component = document.createElement(`div`);
            this.notice.UI.component.classList.add(UI.css.bodyOverlay, css.box);
            this.notice.UI.component.prepend(this.notice);
            document.body.append(this.notice.UI.component);
            document.body.classList.add(UI.css.bodyHideOverflow);

            this.notice.dispatchEvent(new CustomEvent(`UI.created`));
            this.notice.dispatchEvent(new CustomEvent(`UI.activated`));

            // Якщо передано delay, автоматичне видалення через заданий час
            if (conf.delay) {
                await new Promise((resolve) => setTimeout(resolve, conf.delay));

                _Notice.remove();

                if (typeof conf.callback === `function`) {
                    await conf.callback();
                }
            } else {
                // Чекати remove() на екземплярі
                await removePromise;
            }
        }, userConf, selfName);

        // Публічний об'єкт що повертає Notice()
        const _Notice = {
            /**
             * Вставити елемент/елементи в повідомлення
             *
             * @return {this}
             */
            insert: (...nodes) => {
                if (this.notice) {
                    this.notice.dispatchEvent(new CustomEvent(`UI.beforeInsert`));
                    this.notice.innerHTML = null;
                    this.notice.append(...nodes);
                    this.notice.dispatchEvent(new CustomEvent(`UI.inserted`));
                }
                return _Notice;
            },


            /**
             * Деактивувати повідомлення
             *
             * @return {this}
             */
            remove: () => {
                if (this.notice) {
                    this.notice.dispatchEvent(new CustomEvent(`UI.beforeRemove`));
                    this.notice.UI.component.remove();
                    document.body.classList.remove(UI.css.bodyHideOverflow);
                    delete this.notice.UI;
                    this.notice.dispatchEvent(new CustomEvent(`UI.removed`));
                    resolveRemovePromise();
                }
                return _Notice;
            },

            /**
             * Отримати повідомлення
             *
             * @returns {HTMLElement}
             */
            get: this.notice
        }

        return _Notice;
    }

    /**
     * Popup вікно
     *
     * @event UI.activated
     * @event UI.unactivated
     * @event UI.beforeShow
     * @event UI.showed
     * @event UI.beforeHide
     * @event UI.hidden
     *
     * @param {string|null} [id = null] Ідентифікатор елемента або нічого
     * @return {Object} Клас-будівельник
     * @see https://kroloburet.github.io/UI/#popup
     */
    Popup(id = null) {
        // Ім'я методу
        const selfName = `Popup`;

        // CSS селектори які використовує метод
        const css = {
            box: `UI_${selfName}-box`,
            show: `UI_${selfName}-show`,
            closeButton: `UI_${selfName}-close-btn`,
        };

        // Колекція елементів для опрацювання
        const collection = [...document.querySelectorAll(`.UI_${selfName}`)]
            .filter(el => !UI.#isDisabledNode(el) && el.id);

        return new class {
            constructor() {
                this.#activate();
            }

            /**
             * Опрацювати неактивовані елементи колекції
             *
             * @returns {this}
             * @private
             */
            #activate() {
                if (!id) {
                    // Активувати колекцію
                    collection.filter(el => !UI.#isActivate(el, selfName)).forEach(pop => {
                        // Додати обгортку, кнопки та події
                        pop.UI = {};
                        pop.UI.component = document.createElement(`div`);
                        pop.UI.closeButton = document.createElement(`span`);
                        pop.UI.component.classList.add(UI.css.bodyOverlay, css.box);
                        pop.UI.component.onclick = e =>
                            e.target === pop.UI.component ? this.hide() : null;
                        pop.UI.closeButton.classList.add(css.closeButton, `fa-solid`, `fa-times-circle`);
                        pop.UI.closeButton.onclick = this.hide;
                        pop.prepend(pop.UI.closeButton);
                        pop.UI.component.prepend(pop);
                        document.body.append(pop.UI.component);
                        // Помітити елемент як активований
                        UI.#markActivate(pop, selfName);
                    });
                } else {
                    this.show();
                }
                return this;
            }

            /**
             * Показати popup
             *
             * @returns {this}
             */
            show() {
                const pop = collection.filter(el => UI.#isActivate(el, selfName) && el.id === id)[0];
                if (!pop)
                    throw ReferenceError(`The transmitted argument "id" is not correct or element not found`);
                pop.dispatchEvent(new CustomEvent(`UI.beforeShow`));
                pop.UI.component.classList.add(css.show);
                document.body.classList.add(UI.css.bodyHideOverflow);
                pop.dispatchEvent(new CustomEvent(`UI.showed`));
                return this;
            }

            /**
             * Сховати всі popup
             *
             * @returns {this}
             */
            hide() {
                collection.filter(el => UI.#isActivate(el, selfName)).forEach(pop => {
                    pop.dispatchEvent(new CustomEvent(`UI.beforeHide`));
                    pop.UI.component.classList.remove(css.show);
                    pop.dispatchEvent(new CustomEvent(`UI.hidden`));
                });
                document.body.classList.remove(UI.css.bodyHideOverflow);
                return this;
            }

            /**
             * Отримати активовані елементи колекції
             *
             * @returns {Array}
             */
            get get() {
                return collection.filter(el => UI.#isActivate(el, selfName));
            }
        }
    }

    /**
     * Обмеження радка вводу
     *
     * @event UI.created
     * @event UI.beforeShow
     * @event UI.showed
     * @event UI.beforeHide
     * @event UI.hidden
     * @event UI.beforeCut
     * @event UI.cut
     * @event UI.beforeRemove
     * @event UI.removed
     *
     * @param {HTMLElement} field Поле що опрацьовується
     * @param {number|string} [limit = 50] Символів дозволено
     * @return {Object} Клас-будівельник
     * @see https://kroloburet.github.io/UI/#lim
     */
    Lim(field, limit = 50) {
        // Ім'я методу
        const selfName = `Lim`;

        return new class {
            constructor() {
                this.#activate();
            }

            /**
             * Створити компонент якщо не створено,
             * опрацьовувати поле
             *
             * @returns {undefined|this}
             * @private
             */
            #activate() {
                // Компонент не створено -- створити
                if (!field.UI) {
                    if (![`INPUT`, `TEXTAREA`].includes(field.tagName) && ![`text`, `textarea`].includes(field.type))
                        throw TypeError(`Expected: HTMLElement INPUT or TEXTAREA in "trigger" argument.`);
                    if (isNaN(limit))
                        throw TypeError(`Expected: type number in "limit" argument.`);
                    if (UI.#isDisabledNode(field)) return;
                    field.UI = {};
                    field.UI.limit = parseInt(limit, 10);
                    field.UI.component = UI.#formComponent.wrap(field);
                    field.UI.counter = document.createElement(`span`);
                    field.UI.counter.textContent = limit.toString();
                    field.UI.counter.classList.add(`UI_${selfName}`);
                    field.after(field.UI.counter);
                    field.addEventListener('blur', () => {
                        this.cut().hide();
                    });
                    field.dispatchEvent(new CustomEvent(`UI.created`));
                }
                // Опрацювати поле
                return this.run();
            }

            /**
             * Прикріпити лічильник до поля,
             * опрацьовувати поле
             *
             * @returns {this}
             */
            run() {
                this.show();
                if (field.value.length <= field.UI.limit) {
                    field.UI.counter.textContent = (field.UI.limit - field.value.length).toString();
                } else {
                    this.cut();
                }
                return this;
            }

            /**
             * Прикріпити лічильник до поля
             *
             * @returns {this}
             */
            show() {
                field.dispatchEvent(new CustomEvent(`UI.beforeShow`));
                field.after(field.UI.counter);
                field.focus();
                field.dispatchEvent(new CustomEvent(`UI.showed`));
                return this;
            }

            /**
             * Відкріпити лічильник від поля
             *
             * @returns {this}
             */
            hide() {
                field.dispatchEvent(new CustomEvent(`UI.beforeHide`));
                field.UI.counter.remove();
                field.dispatchEvent(new CustomEvent(`UI.hidden`));
                return this;
            }

            /**
             * Обрізати рядок в полі до ліміту
             *
             * @returns {this}
             */
            cut() {
                field.dispatchEvent(new CustomEvent(`UI.beforeCut`));
                field.value = field.value.substring(0, field.UI.limit);
                field.UI.counter.textContent = `0`;
                field.dispatchEvent(new CustomEvent(`UI.cut`));
                return this;
            }

            /**
             * Видалити лічильник
             *
             * @returns {this}
             */
            remove() {
                field.dispatchEvent(new CustomEvent(`UI.beforeRemove`));
                UI.#formComponent.unwrap(field);
                delete field.UI;
                field.dispatchEvent(new CustomEvent(`UI.removed`));
                return this;
            }

            /**
             * Отримати поле що опрацьовано методом
             *
             * @returns {HTMLElement}
             */
            get get() {
                return field;
            }
        }
    }

    /**
     * Input type="file"
     * Метод будує компонент навколо полів
     * <input type="file"> з collection та забезпечує
     * управління полями через їх компоненти.
     *
     * @event UI.activated
     * @event UI.unactivated
     * @event UI.beforeRender
     * @event UI.rendered
     * @event UI.beforeRemove
     * @event UI.removed
     *
     * @param {Object} userConf Конфігурація користувача
     * @param {string} [userConf.selector = `UI_InputFile`] Селектор input type="file" елемента/тів для опрацювання
     * @param {string} [userConf.placeholder = `Choose a file`] Текст в полі компонента, якщо файл не обрано
     * @param {string} [userConf.choiceIcon = `📂`] Текст або HTML-іконки обрання файла/лів
     * @return {Object} Клас-будівельник
     * @see https://kroloburet.github.io/UI/#inputFile
     */
    InputFile(userConf = {}) {
        // Ім'я методу
        const selfName = `InputFile`;

        // CSS селектори які використовує метод
        const css = {
            control: `UI_${selfName}-control`,
            controlItem: `UI_${selfName}-control-item`,
            controlItemText: `UI_${selfName}-control-item-text`,
            controlPlaceholder: `UI_${selfName}-control-placeholder`,
        };

        // Конфігурація за замовчуванням
        const defConf = {
            selector: `.UI_${selfName}`,
            placeholder: `Choose a file`,
            choiceIcon: `<i class="fa-solid fa-folder-open">`,
        };

        // Селектор пошуку елементів для опрацювання
        const selector = userConf.selector ?? defConf.selector;

        // Колекція елементів для опрацювання
        const collection = [...document.querySelectorAll(selector)]
            .filter(el => el.tagName === `INPUT` && el.type === `file` && !UI.#isDisabledNode(el));

        return new class {
            constructor() {
                this.#activate();
            }

            /**
             * Опрацювати неактивовані елементи колекції
             *
             * @returns {this}
             * @private
             */
            #activate() {
                // Деактивувати активовані, щоб оновити конфігурацію
                this.remove();
                // Активувати колекцію
                collection.forEach(input => {
                    // Об'єкт з публічними полями елемента колекції
                    input.UI = {};
                    input.UI.conf = Object.assign({}, defConf, userConf, UI.#getDatasetConf(input));
                    input.UI.component = UI.#formComponent.wrap(input);
                    input.UI.choiceButton = document.createElement(`span`);
                    input.UI.control = document.createElement(`div`);
                    input.UI.placeholder = document.createElement(`span`);
                    input.UI.hasMultiple = input.multiple;
                    // Додати елементи, класи та слухачів подій
                    if (input.form) {
                        input.UI.resetHandler = () => setTimeout(() => this.render(input), 100);
                        input.form.addEventListener(`reset`, input.UI.resetHandler);
                    }
                    input.onchange = () => {
                        this.render(input);
                        input.UI.control.classList.add(UI.css.focusForm);
                        input.UI.control.classList.remove(UI.css.invalidForm);
                    };
                    input.oninvalid = () => input.UI.control.classList.add(UI.css.invalidForm);
                    input.onblur = () => input.UI.control.classList.remove(UI.css.focusForm);
                    input.UI.control.classList.add(css.control, UI.css.noScrollbar);
                    input.UI.choiceButton.classList.add(UI.css.formComponentControl);
                    input.UI.choiceButton.innerHTML = input.UI.conf.choiceIcon;
                    input.UI.placeholder.classList.add(css.controlPlaceholder);
                    input.UI.placeholder.textContent = input.UI.conf.placeholder;
                    input.after(input.UI.choiceButton);
                    input.before(input.UI.control);
                    this.render(input);
                    // Помітити елемент як активований
                    UI.#markActivate(input, selfName);
                });
                return this;
            }

            /**
             * Показати інформацію про обрані файли
             *
             * @param {HTMLElement|null} input Поле
             * @returns {this}
             */
            render(input = null) {
                const worker = input => {
                    input.dispatchEvent(new CustomEvent(`UI.beforeRender`));
                    input.UI.control.innerHTML = ``;
                    input.UI.component.removeAttribute(`title`);
                    let files = input.files;
                    let totalSize = 0;
                    if (files && files.length) {
                        [...files].forEach(file => {
                            let controlItem = document.createElement(`span`);
                            let controlItemText = document.createElement(`span`);
                            controlItem.classList.add(css.controlItem);
                            controlItemText.classList.add(css.controlItemText);
                            controlItemText.textContent = file.name;
                            controlItem.append(controlItemText);
                            input.UI.control.append(controlItem);
                            totalSize += file.size;
                        });
                        input.UI.component.title = `Total size: ${(totalSize / 1048576).toFixed(3)} Mb`;
                    } else {
                        input.UI.control.append(input.UI.placeholder);
                    }
                    input.UI.control.classList.toggle(UI.css.requiredForm, input.required);
                    input.UI.component.classList.toggle(UI.css.disabledForm, input.disabled);
                    input.dispatchEvent(new CustomEvent(`UI.rendered`));
                };
                // Опрацювати всю колекцію якщо поле не передано
                !(input instanceof HTMLElement) ? collection.forEach(worker) : worker(input);
                return this;
            }

            /**
             * Деактивувати активовані елементи колекції
             *
             * @return {this}
             */
            remove() {
                collection.filter(el => UI.#isActivate(el, selfName)).forEach(input => {
                    input.dispatchEvent(new CustomEvent(`UI.beforeRemove`));
                    // Повернути елементи в стан до активації
                    input.onchange = null;
                    input.oninvalid = null;
                    input.onblur = null;
                    if (input.form) input.form.removeEventListener(`reset`, input.UI.resetHandler);
                    UI.#unmarkActivate(input, selfName);
                    UI.#formComponent.unwrap(input);
                    delete input.UI;
                    input.dispatchEvent(new CustomEvent(`UI.removed`));
                });
                return this;
            }

            /**
             * Отримати активовані елементи колекції
             *
             * @returns {Array}
             */
            get get() {
                return collection.filter(el => UI.#isActivate(el, selfName));
            }
        }
    }

    /**
     * Input type="range"
     * Метод будує компонент навколо полів
     * <input type="range"> з collection та забезпечує
     * управління полями через їх компоненти.
     *
     * @event UI.activated
     * @event UI.unactivated
     * @event UI.beforeRender
     * @event UI.rendered
     * @event UI.beforeRemove
     * @event UI.removed
     *
     * @param {Object} userConf Конфігурація користувача
     * @param {string} [userConf.selector = `UI_InputRange`] Селектор input type="range" елемента/тів для опрацювання
     * @return {Object} Клас-будівельник
     * @see https://kroloburet.github.io/UI/#inputRange
     */
    InputRange(userConf = {}) {
        // Ім'я методу
        const selfName = `InputRange`;

        // CSS селектори які використовує метод
        const css = {
            infobox: `UI_${selfName}-infobox`,
        };

        // Конфігурація за замовчуванням
        const defConf = {
            selector: `.UI_${selfName}`,
        };

        // Селектор пошуку елементів для опрацювання
        const selector = userConf.selector ?? defConf.selector;

        // Колекція елементів для опрацювання
        const collection = [...document.querySelectorAll(selector)]
            .filter(el => el.tagName === `INPUT` && el.type === `range` && !UI.#isDisabledNode(el));

        return new class {
            constructor() {
                this.#activate();
            }

            /**
             * Опрацювати неактивовані елементи колекції
             *
             * @returns {this}
             * @private
             */
            #activate() {
                // Деактивувати активовані, щоб оновити конфігурацію
                this.remove();
                // Активувати колекцію
                collection.forEach(input => {
                    // Об'єкт з публічними полями елемента колекції
                    input.UI = {};
                    input.UI.conf = Object.assign({}, defConf, userConf, UI.#getDatasetConf(input));
                    // Додати елементи, класи та слухачів подій
                    input.UI.component = UI.#formComponent.wrap(input);
                    input.UI.infobox = document.createElement(`span`);
                    input.UI.infobox.classList.add(UI.css.formComponentControl, css.infobox);
                    input.UI.infobox.innerText = input.value || `0`;
                    input.after(input.UI.infobox);
                    if (input.disabled) {
                        input.UI.component.classList.add(UI.css.disabledForm);
                        input.value = parseFloat(input.min) || 0;
                    } else {
                        input.oninput = () => {
                            input.dispatchEvent(new CustomEvent(`UI.beforeRender`));
                            input.UI.infobox.innerText = input.value;
                            input.dispatchEvent(new CustomEvent(`UI.rendered`));
                        }
                    }
                    if (input.form) {
                        input.UI.resetHandler = () =>
                            setTimeout(() => input.UI.infobox.innerText = input.value || `0`, 100);
                        input.form.addEventListener(`reset`, input.UI.resetHandler);
                    }
                    // Помітити елемент як активований
                    UI.#markActivate(input, selfName);
                });
                return this;
            }

            /**
             * Деактивувати активовані елементи колекції
             *
             * @return {this}
             */
            remove() {
                collection.filter(el => UI.#isActivate(el, selfName)).forEach(input => {
                    input.dispatchEvent(new CustomEvent(`UI.beforeRemove`));
                    // Повернути елементи в стан до активації
                    input.oninput = null;
                    if (input.form) input.form.removeEventListener(`reset`, input.UI.resetHandler)
                    UI.#unmarkActivate(input, selfName);
                    UI.#formComponent.unwrap(input);
                    delete input.UI;
                    input.dispatchEvent(new CustomEvent(`UI.removed`));
                });
                return this;
            }

            /**
             * Отримати активовані елементи колекції
             *
             * @returns {Array}
             */
            get get() {
                return collection.filter(el => UI.#isActivate(el, selfName));
            }
        }
    }

    /**
     * Input type="number"
     * Метод будує компонент навколо полів
     * <input type="number"> з collection та забезпечує
     * управління полями через їх компоненти.
     *
     * @event UI.activated
     * @event UI.unactivated
     * @event UI.beforeSetVal
     * @event UI.setVal
     * @event UI.beforeInc
     * @event UI.inc
     * @event UI.beforeDec
     * @event UI.dec
     * @event UI.beforeRemove
     * @event UI.removed
     *
     * @param {Object} userConf Конфігурація користувача
     * @param {string} [userConf.selector = `UI_InputNumber`] Селектор input type="number" елемента/тів для опрацювання
     * @param {string} [userConf.incIcon = `➕`] Іконка на кнопці додавання. Може містити HTML
     * @param {string} [userConf.decIcon = `➖`] Іконка на кнопці віднімання. Може містити HTML
     * @param {string} [userConf.title = `Put the cursor in the field and scroll it ;)`] Текст атрибуту "title" компонента
     * @return {Object} Клас-будівельник
     * @see https://kroloburet.github.io/UI/#inputNumber
     */
    InputNumber(userConf = {}) {
        // Ім'я методу
        const selfName = `InputNumber`;

        // CSS селектори які використовує метод
        const css = {
            inc: `UI_${selfName}-inc`,
            dec: `UI_${selfName}-dec`,
        };

        // Конфігурація за замовчуванням
        const defConf = {
            selector: `.UI_${selfName}`,
            incIcon: `<i class="fa-solid fa-plus"></i>`,
            decIcon: `<i class="fa-solid fa-minus"></i>`,
            title: `Put the cursor in the field and scroll it ;)`,
        };

        // Селектор пошуку елементів для опрацювання
        const selector = userConf.selector ?? defConf.selector;

        // Колекція елементів для опрацювання
        const collection = [...document.querySelectorAll(selector)]
            .filter(el => el.tagName === `INPUT` && el.type === `number` && !UI.#isDisabledNode(el));

        return new class {
            constructor() {
                this.#activate();
            }

            /**
             * Опрацювати неактивовані елементи колекції
             *
             * @returns {this}
             * @private
             */
            #activate() {
                // Деактивувати активовані, щоб оновити конфігурацію
                this.remove();
                // Активувати колекцію
                collection.forEach(input => {
                    // Об'єкт з публічними полями елемента колекції
                    input.UI = {};
                    input.UI.conf = Object.assign({}, defConf, userConf, UI.#getDatasetConf(input));
                    input.UI.component = UI.#formComponent.wrap(input);
                    input.UI.incButton = document.createElement(`span`);
                    input.UI.decButton = document.createElement(`span`);
                    input.UI.hasDisabled = (input.disabled || input.readOnly);
                    input.UI.step = () => parseFloat(input.step) || 1;
                    input.UI.max = () => parseFloat(input.max);
                    input.UI.min = () => parseFloat(input.min);
                    input.UI.val = () => parseFloat(input.value);
                    input.UI.up = () => input.UI.val() + input.UI.step();
                    input.UI.down = () => input.UI.val() - input.UI.step();
                    input.UI.setValid = () => input.classList.remove(UI.css.invalidForm);
                    input.UI.setInvalid = () => input.classList.add(UI.css.invalidForm);
                    input.UI.initVal = () => {
                        if (!input.UI.hasDisabled && isNaN(input.UI.val())) {
                            input.value = (input.value || input.UI.min() || input.UI.max() || 0);
                        }
                    };
                    // Додати елементи, класи та слухачів подій
                    input.UI.component.title = input.UI.conf.title;
                    input.UI.incButton.classList.add(UI.css.formComponentControl, css.inc);
                    input.UI.decButton.classList.add(UI.css.formComponentControl, css.dec);
                    input.UI.incButton.innerHTML = input.UI.conf.incIcon;
                    input.UI.decButton.innerHTML = input.UI.conf.decIcon;
                    input.after(input.UI.decButton, input.UI.incButton);
                    input.UI.incButton.onclick = e => {
                        e.preventDefault();
                        this.setVal(`inc`, input);
                    };
                    input.UI.decButton.onclick = e => {
                        e.preventDefault();
                        this.setVal(`dec`, input);
                    };
                    input.oninput = () => {
                        let max = input.UI.max();
                        let min = input.UI.min();
                        let val = input.UI.val();
                        if (input.UI.hasDisabled) {
                            input.value = min;
                            return;
                        }
                        input.UI.setValid();
                        if (isNaN(val)) input.UI.setInvalid();
                        else if (!isNaN(max) && val > max) input.value = max;
                        else if (!isNaN(min) && val < min) input.value = min;
                    };
                    input.UI.initVal();
                    // Помітити елемент як активований
                    UI.#markActivate(input, selfName);
                });
                return this;
            }

            /**
             * Встановити значення поля
             *
             * @param {'inc'|'dec'}  action Інкремент чи декремент значення поля
             * @param {HTMLElement|null} input Поле
             * @returns {undefined|this}
             */
            setVal(action, input = null) {
                const worker = input => {
                    if (input.UI.hasDisabled) return;
                    input.UI.initVal();
                    input.UI.setValid();
                    input.dispatchEvent(new CustomEvent(`UI.beforeSetVal`));
                    if (action === `inc`) {
                        input.dispatchEvent(new CustomEvent(`UI.beforeInc`));
                        let max = input.UI.max();
                        let up = input.UI.up();
                        input.value = isNaN(max) ? up : max > up ? up : max;
                        input.dispatchEvent(new CustomEvent(`UI.inc`));
                    } else if (action === `dec`) {
                        input.dispatchEvent(new CustomEvent(`UI.beforeDec`));
                        let min = input.UI.min();
                        let down = input.UI.down();
                        input.value = isNaN(min) ? down : min < down ? down : min;
                        input.dispatchEvent(new CustomEvent(`UI.dec`));
                    }
                    input.dispatchEvent(new Event(`change`));
                    input.focus();
                    input.dispatchEvent(new CustomEvent(`UI.setVal`));
                };
                // Опрацювати всю колекцію якщо поле не передано
                !(input instanceof HTMLElement) ? collection.forEach(worker) : worker(input);
                return this;
            }

            /**
             * Деактивувати активовані елементи колекції
             *
             * @return {this}
             */
            remove() {
                collection.filter(el => UI.#isActivate(el, selfName)).forEach(input => {
                    input.dispatchEvent(new CustomEvent(`UI.beforeRemove`));
                    // Повернути елементи в стан до активації
                    input.oninput = null;
                    UI.#unmarkActivate(input, selfName);
                    UI.#formComponent.unwrap(input);
                    delete input.UI;
                    input.dispatchEvent(new CustomEvent(`UI.removed`));
                });
                return this;
            }

            /**
             * Отримати активовані елементи колекції
             *
             * @returns {Array}
             */
            get get() {
                return collection.filter(el => UI.#isActivate(el, selfName));
            }
        }
    }

    /**
     * Список що випадає
     * Метод будує компонент навколо полів
     * <select> з collection та забезпечує
     * управління полями через їх компоненти.
     *
     * @event UI.activated
     * @event UI.unactivated
     * @event UI.beforeDropdownShow
     * @event UI.dropdownShowed
     * @event UI.beforeDropdownHide
     * @event UI.dropdownHidden
     * @event UI.beforeSearch
     * @event UI.searched
     * @event UI.beforeSelected event.detail = {indexes: array, selected: boolean}
     * @event UI.selected event.detail = {indexes: array, selected: boolean}
     * @event UI.beforeRender
     * @event UI.rendered
     * @event UI.beforeRemove
     * @event UI.removed
     *
     * @param {Object} userConf Конфігурація користувача
     * @param {string} [userConf.selector = `UI_Select`] Селектор select елемента/тів для опрацювання
     * @param {boolean} [userConf.withSearch = true] Чи потрібен в компоненті пошук по опціях спаску
     * @param {string} [userConf.selectPlaceholder = `Make a choice`] Заповнювач порожнього поля списку
     * @param {string} [userConf.searchPlaceholder = `Search on the list`] Заповнювач порожнього поля пошуку по опціях списку
     * @param {string} [userConf.openIcon = `˅`] Іконка кнопки, що показує dropdown компонента. Може містити HTML
     * @param {string} [userConf.closeIcon = `˄`] Іконка кнопки, що ховає dropdown компонента. Може містити HTML
     * @param {string} [userConf.delItemIcon = `✖`] Іконка кнопки видалення обраної опції в multiple компоненті. Може містити HTML
     * @return {Object} Клас-будівельник
     * @see https://kroloburet.github.io/UI/#select
     */
    Select(userConf = {}) {
        // Ім'я методу
        const selfName = `Select`;

        // Конфігурація за замовчуванням
        const defConf = {
            selector: `.UI_${selfName}`,
            withSearch: false,
            selectPlaceholder: `Make a choice`,
            searchPlaceholder: `Search on the list`,
            openIcon: `<i class="fa-solid fa-chevron-down"></i>`,
            closeIcon: `<i class="fa-solid fa-chevron-up"></i>`,
            delItemIcon: `<i class="fa-solid fa-xmark"></i>`,
        };

        // CSS селектори які використовує метод
        const css = {
            overlay: `UI_${selfName}-overlay`,
            dropdown: `UI_${selfName}-dropdown`,
            dropdownList: `UI_${selfName}-dropdown-list`,
            dropdownItem: `UI_${selfName}-dropdown-item`,
            dropdownShow: `UI_${selfName}-dropdown-show`,
            control: `UI_${selfName}-control`,
            controlItem: `UI_${selfName}-control-item`,
            controlItemMultiply: `UI_${selfName}-control-item-multiple`,
            controlItemText: `UI_${selfName}-control-item-text`,
            controlItemDel: `UI_${selfName}-control-item-del`,
            controlPlaceholder: `UI_${selfName}-control-placeholder`,
            selectSearchInput: `UI_${selfName}-search-input`,
            hover: `UI_${selfName}-item-hover`,
        };

        // Селектор пошуку елементів для опрацювання
        const selector = userConf.selector ?? defConf.selector;

        // Колекція елементів для опрацювання
        const collection = [...document.querySelectorAll(selector)]
            .filter(el => el.tagName === `SELECT` && !UI.#isDisabledNode(el));

        return new class {
            constructor() {
                this.#activate();
            }

            /**
             * Опрацювати неактивовані елементи колекції
             *
             * @returns {this}
             * @private
             */
            #activate() {
                // Деактивувати активовані, щоб оновити конфігурацію
                this.remove();
                // Активувати колекцію
                collection.forEach(select => {
                    // Об'єкт з публічними полями елемента колекції
                    select.UI = {};
                    select.UI.conf = Object.assign({}, defConf, userConf, UI.#getDatasetConf(select));
                    select.UI.component = UI.#formComponent.wrap(select);
                    select.UI.overlay = document.createElement(`div`);
                    select.UI.control = document.createElement(`div`);
                    select.UI.dropdown = document.createElement(`div`);
                    select.UI.dropdownList = document.createElement(`div`);
                    select.UI.dropdownToggleButton = document.createElement(`span`);
                    select.UI.hasDisabled = select.disabled;
                    select.UI.hasMultiple = select.multiple;
                    select.UI.hasSearch = select.UI.conf.withSearch;
                    select.UI.dropdownItems = [];
                    select.UI.controlPlaceholder;
                    // Побудувати компонент
                    select.UI.dropdownToggleButton.classList.add(UI.css.formComponentControl);
                    select.UI.dropdownToggleButton.innerHTML = select.UI.conf.openIcon;
                    select.UI.dropdown.classList.add(css.dropdown);
                    select.UI.dropdownList.tabIndex = 0;
                    select.UI.dropdownList.classList.add(css.dropdownList, UI.css.scrollbar);
                    select.UI.control.classList.add(css.control, UI.css.noScrollbar);
                    select.UI.overlay.classList.add(css.overlay)
                    select.before(select.UI.control);
                    select.after(select.UI.dropdown, select.UI.dropdownToggleButton);
                    select.UI.dropdown.append(select.UI.dropdownList);
                    if (select.UI.hasSearch) {
                        select.UI.searchInput = document.createElement(`input`);
                        select.UI.searchInput.type = `text`;
                        select.UI.searchInput.classList.add(css.selectSearchInput);
                        select.UI.searchInput.placeholder = select.UI.conf.searchPlaceholder;
                        select.UI.searchInput.oninput = () => this.search(select.UI.searchInput.value, select);
                        select.UI.dropdown.prepend(select.UI.searchInput);
                    }
                    let hasDefaultSelected = [...select.options].filter(opt => opt.defaultSelected).length;
                    if (select.UI.conf.selectPlaceholder && !hasDefaultSelected) select.selectedIndex = -1;
                    this.render(select);
                    // Слухачі подій для показу та приховування dropdown
                    select.UI.overlay.onclick = () => this.hideDropdown(select);
                    select.UI.component.onclick = e => {
                        let control = [
                            select.UI.component,
                            select.UI.control,
                            select.UI.controlItemText,
                            select.UI.controlPlaceholder,
                            select.UI.dropdownToggleButton,
                            select.UI.dropdownToggleButton.firstChild,
                        ].includes(e.target);
                        if (control) {
                            let show = select.UI.dropdown.classList.contains(css.dropdownShow);
                            show ? this.hideDropdown(select) : this.showDropdown(select);
                        }
                    };
                    // Слухачі подій поля
                    select.oninvalid = () => select.UI.control.classList.add(UI.css.invalidForm);
                    if (select.form) {
                        select.UI.resetHandler = () => setTimeout(() => this.render(select), 100);
                        select.form.addEventListener(`reset`, select.UI.resetHandler);
                    }
                    // Помітити елемент як активований
                    UI.#markActivate(select, selfName);
                });
                return this;
            }

            #setDropdownListItemInteractive(select = null) {
                const worker = select => {
                    if (! select.UI.dropdownItems.length) return;
                    select.UI.dropdownList.focus();
                    let index = select.UI.controlPlaceholder ? -1 : 0;
                    // Set index of next or previous item
                    function setIndex(currentIndex, direction, items) {
                        const isUp = direction === 'up';
                        let newIndex = (currentIndex + (isUp ? -1 : 1) + items.length) % items.length;
                        while (items[newIndex].hidden) {
                            newIndex = (newIndex + (isUp ? -1 : 1) + items.length) % items.length;
                        }
                        index = newIndex;
                        items.forEach(item => item.classList.remove(css.hover));
                        items[index].classList.add(css.hover);
                        items[index].scrollIntoView({ block: "center", behavior: "smooth" });
                    }
                    // Key event controller
                    const keyEventController = event => {
                        if (event.key === `ArrowUp` || event.key === `ArrowDown`) {
                            select.UI.dropdownList.focus();
                            const direction = event.key === 'ArrowUp' ? 'up' : 'down';
                            setIndex(index, direction, select.UI.dropdownItems);
                        } else if (event.key === `Enter`) {
                            event.preventDefault();
                            event.stopPropagation();
                            event.stopImmediatePropagation();
                            if (select.options[index]) this.selected(true, [index], select)
                        } else {
                            if (select.UI.hasSearch) select.UI.searchInput.focus();
                        }
                    }
                    // Set events
                    select.UI.dropdownList.onkeydown = keyEventController;
                    if (select.UI.hasSearch) select.UI.searchInput.onkeydown = keyEventController;
                }
                // Опрацювати всю колекцію якщо поле не передано
                !(select instanceof HTMLElement) ? collection.forEach(worker) : worker(select);
                return this;
            }

            /**
             * Додати placeholder
             *
             * @param {HTMLElement|null} select Поле
             * @returns {undefined|this}
             */
            #addPlaceholder(select = null) {
                const worker = select => {
                    if (!select.UI.conf.selectPlaceholder) return;
                    select.selectedIndex = -1;
                    select.UI.value = select.UI.hasMultiple ? [] : ``;
                    select.UI.control.innerHTML = ``;
                    select.UI.controlPlaceholder = document.createElement(`span`);
                    select.UI.controlPlaceholder.classList.add(css.controlPlaceholder);
                    select.UI.controlPlaceholder.textContent = select.UI.conf.selectPlaceholder;
                    select.UI.control.prepend(select.UI.controlPlaceholder);
                }
                // Опрацювати всю колекцію якщо поле не передано
                !(select instanceof HTMLElement) ? collection.forEach(worker) : worker(select);
                return this;
            }

            /**
             * Розташувати dropdown компонента
             *
             * @param {HTMLElement|null} select Поле
             * @returns {undefined|this}
             */
            #setDropdownPosition(select = null) {
                const worker = select => {
                    if (select.UI.hasDisabled || !select.UI.dropdownItems.length) return;
                    const dropdown = select.UI.dropdown;
                    const dropdownDistanceToBtm = window.innerHeight - dropdown.getBoundingClientRect().bottom;
                    const dropdownDistanceToTop = dropdown.getBoundingClientRect().top;
                    const dropdownDistanceToLeft = dropdown.getBoundingClientRect().left;
                    const dropdownDistanceToRight = dropdown.getBoundingClientRect().right;
                    const dropdownBtmStyle = window.getComputedStyle(dropdown).bottom;
                    const dropdownTopStyle = window.getComputedStyle(dropdown).top;
                    // Розташувати dropdown
                    if (dropdownDistanceToBtm <= 0) {
                        dropdown.style.bottom = dropdownTopStyle;
                        dropdown.style.top = `auto`;
                    } else if (dropdownDistanceToTop <= 0) {
                        dropdown.style.top = dropdownBtmStyle;
                        dropdown.style.bottom = `auto`;
                    }
                    if (dropdownDistanceToLeft <= 0) {
                        dropdown.style.left = 0;
                        dropdown.style.right = `auto`;
                    } else if (dropdownDistanceToRight >= window.innerWidth) {
                        dropdown.style.right = 0;
                        dropdown.style.left = `auto`;
                    }
                }
                // Опрацювати всю колекцію якщо поле не передано
                !(select instanceof HTMLElement) ? collection.forEach(worker) : worker(select);
                return this;
            }

            /**
             * Показати dropdown компонента
             *
             * @param {HTMLElement|null} select Поле
             * @returns {undefined|this}
             */
            showDropdown(select = null) {
                const worker = select => {
                    if (select.UI.hasDisabled || !select.UI.dropdownItems.length) return;
                    select.dispatchEvent(new CustomEvent(`UI.beforeDropdownShow`));
                    select.after(select.UI.overlay);
                    select.UI.control.classList.contains(UI.css.invalidForm)
                        ? select.UI.control.classList.replace(UI.css.invalidForm, UI.css.focusForm)
                        : select.UI.control.classList.add(UI.css.focusForm);
                    select.UI.dropdown.classList.add(css.dropdownShow);
                    select.UI.dropdownToggleButton.innerHTML = select.UI.conf.closeIcon;
                    this.#setDropdownPosition(select);
                    this.#setDropdownListItemInteractive(select);
                    select.dispatchEvent(new CustomEvent(`UI.dropdownShowed`));
                }
                this.hideDropdown();
                // Опрацювати всю колекцію якщо поле не передано
                !(select instanceof HTMLElement) ? collection.forEach(worker) : worker(select);
                return this;
            }

            /**
             * Сховати dropdown компонента
             *
             * @param {HTMLElement|null} select Поле
             * @returns {undefined|this}
             */
            hideDropdown(select = null) {
                const worker = select => {
                    if (!select.UI || select.UI.hasDisabled) return;
                    select.dispatchEvent(new CustomEvent(`UI.beforeDropdownHide`));
                    select.UI.overlay.remove();
                    select.UI.component.style.zIndex = `auto`;
                    select.UI.dropdown.classList.remove(css.dropdownShow);
                    select.UI.control.classList.remove(UI.css.focusForm);
                    select.UI.dropdownToggleButton.innerHTML = select.UI.conf.openIcon;
                    select.dispatchEvent(new CustomEvent(`UI.dropdownHidden`));
                };
                // Опрацювати всю колекцію якщо поле не передано
                !(select instanceof HTMLElement) ? collection.forEach(worker) : worker(select);
                return this;
            }

            /**
             * Шукати по запиту серед тексту опцій
             * чи значень атрибутів "data-find-of" опцій.
             * Залишити лише знайдені
             *
             * @param {string} query Рядок запиту
             * @param {HTMLElement|null} select Поле
             * @returns {this}
             */
            search(query, select = null) {
                const worker = select => {
                    if (
                        select.UI.hasDisabled ||
                        !select.UI.hasSearch ||
                        !select.UI.dropdownItems.length
                    ) return;
                    select.dispatchEvent(new CustomEvent(`UI.beforeSearch`));
                    const q = query.toLowerCase();
                    select.UI.dropdownItems.forEach((item, index) => {
                        item.hidden = !(
                            item.textContent.toLowerCase().indexOf(q) > -1 ||
                            select.options[index].dataset.findOf?.toLowerCase().indexOf(q) > -1
                        );
                    });
                    // this.#setDropdownListItemInteractive(select);
                    select.dispatchEvent(new CustomEvent(`UI.searched`));
                };
                // Опрацювати всю колекцію якщо поле не передано
                !(select instanceof HTMLElement) ? collection.forEach(worker) : worker(select);
                return this;
            }

            /**
             * Встановити значення атрибута "selected"
             * для опцій поля за індексами та оновити компонент
             *
             * @param {boolean} val Значення атрибуту "selected"
             * @param {Array} indexes Масив індексів опцій
             * @param {HTMLElement|null} select Поле
             * @returns {this}
             */
            selected(val, indexes = [], select = null) {
                if (typeof val !== `boolean`) throw TypeError(`Argument "val" is ${val}, true or false expected!`);
                if (!indexes.length) throw TypeError(`Argument "indexes" is empty!`);
                const worker = select => {
                    if (select.UI.hasDisabled) return;
                    select.dispatchEvent(new CustomEvent(`UI.beforeSelected`, {detail: {indexes, selected: val}}));
                    for (let index of indexes) {
                        let option = select.item(index);
                        if (option.disabled || (!select.UI.hasMultiple && index !== indexes[0])) break;
                        option.selected = val;
                    }
                    this.render(select);
                    if (!select.UI.hasMultiple || !select.UI.dropdownItems.length) this.hideDropdown(select);
                    select.dispatchEvent(new Event(`change`));
                    select.dispatchEvent(new CustomEvent(`UI.selected`, {detail: {indexes, selected: val}}));
                };
                // Опрацювати всю колекцію якщо поле не передано
                !(select instanceof HTMLElement) ? collection.forEach(worker) : worker(select);
                return this;
            }

            /**
             * Синхронізувати компонент з полем
             *
             * @param {HTMLElement|null} select Поле
             * @returns {this}
             */
            render(select = null) {
                const worker = select => {
                    select.dispatchEvent(new CustomEvent(`UI.beforeRender`));
                    // Обнулити дані
                    let value = select.UI.hasMultiple ? [] : ``;
                    select.UI.control.innerHTML = ``;
                    select.UI.dropdownList.innerHTML = ``;
                    select.UI.dropdownItems = [];
                    [...select.options].forEach(option => {
                        // Додати опцію у dropdown
                        let dropdownItem = document.createElement(`div`);
                        dropdownItem.classList.add(css.dropdownItem, ...option.classList);
                        dropdownItem.innerHTML = option.dataset.content || option.textContent;
                        dropdownItem.onclick = () => this.selected(true, [option.index], select);
                        if (option.selected || option.disabled) dropdownItem.hidden = true;
                        select.UI.dropdownItems[option.index] = dropdownItem;
                        select.UI.dropdownList.append(dropdownItem);
                        // Додати як обрані
                        if (option.selected) {
                            let controlItem = document.createElement(`span`);
                            let controlItemText = document.createElement(`span`);
                            let controlItemClass = select.UI.hasMultiple
                                ? css.controlItemMultiply
                                : css.controlItem;
                            select.UI.hasMultiple ? value.push(option.value) : value = select.value;
                            controlItem.classList.add(controlItemClass);
                            controlItemText.classList.add(css.controlItemText);
                            controlItemText.innerHTML = option.dataset.content || option.textContent;
                            controlItemText.onclick = () => this.showDropdown(select);
                            controlItem.append(controlItemText);
                            select.UI.control.append(controlItem);
                            if (select.UI.hasMultiple) {
                                let controlItemDel = document.createElement(`span`);
                                controlItemDel.classList.add(css.controlItemDel);
                                controlItemDel.innerHTML = select.UI.conf.delItemIcon;
                                controlItemDel.onclick = () => this.selected(false, [option.index], select);
                                controlItem.append(controlItemDel);
                            }
                        }
                    });
                    // Додати placeholder
                    if (!select.value) this.#addPlaceholder(select);
                    //
                    select.UI.control.classList.toggle(UI.css.requiredForm, select.required);
                    select.UI.component.classList.toggle(UI.css.disabledForm, select.UI.hasDisabled);
                    // Якщо є запит, показати результат пошуку
                    let searchVal = select.UI.searchInput?.value;
                    if (searchVal) this.search(searchVal, select);
                    // Додати властивість полю для отримання значення {Array|String}
                    select.UI.value = value;
                    select.dispatchEvent(new CustomEvent(`UI.rendered`));
                };
                // Опрацювати всю колекцію якщо поле не передано
                !(select instanceof HTMLElement) ? collection.forEach(worker) : worker(select);
                return this;
            }

            /**
             * Деактивувати активовані елементи колекції
             * та повернути в стан до активації
             *
             * @return {this}
             */
            remove() {
                collection.filter(el => UI.#isActivate(el, selfName)).forEach(select => {
                    select.dispatchEvent(new CustomEvent(`UI.beforeRemove`));
                    // Повернути елементи в стан до активації
                    select.oninvalid = null;
                    if (select.form) select.form.removeEventListener(`reset`, select.UI.resetHandler);
                    UI.#unmarkActivate(select, selfName);
                    UI.#formComponent.unwrap(select);
                    delete select.UI;
                    select.dispatchEvent(new CustomEvent(`UI.removed`));
                });
                return this;
            }

            /**
             * Отримати активовані елементи колекції
             *
             * @returns {Array}
             */
            get get() {
                return collection.filter(el => UI.#isActivate(el, selfName));
            }
        }
    }

    /**
     * Меню
     * Метод будує компонент багаторівневого
     * меню зі списків ul
     *
     * @event UI.activated
     * @event UI.unactivated
     * @event UI.beforeShow
     * @event UI.showed
     * @event UI.beforeHide
     * @event UI.hidden
     * @event UI.beforeRemove
     * @event UI.removed
     *
     * @param {Object} userConf Конфігурація користувача
     * @param {string} [userConf.selector = `UI_Menu`] Селектор ul елемента/тів для опрацювання
     * @param {string} [userConf.toggleIcon = `☰`] Іконка кнопки, яка покаже/сховає меню на малих пристроях. Може містити HTML.
     * @param {boolean} [userConf.markLink = false] Чи позначати пункт меню якщо в ньому є посилання на поточну сторінку
     * @return {Object} Клас-будівельник
     * @see https://kroloburet.github.io/UI/#menu
     */
    Menu(userConf = {}) {
        // Ім'я методу
        const selfName = `Menu`;

        // CSS селектори які використовує метод
        const css = {
            show: `UI_${selfName}-show`,
            toggleButton: `UI_${selfName}-toggle-btn`,
            subToggleButton: `UI_${selfName}-sub-toggle-btn`,
            mark: `UI_${selfName}-mark`,
        };

        // Конфігурація за замовчуванням
        const defConf = {
            selector: `.UI_${selfName}`,
            toggleIcon: `<i class="fa-solid fa-bars"></i>`,
            markLink: false,
        };

        // Селектор пошуку елементів для опрацювання
        const selector = userConf.selector ?? defConf.selector;

        // Колекція елементів для опрацювання
        const collection = [...document.querySelectorAll(selector)]
            .filter(el => el.tagName === `UL` && !UI.#isDisabledNode(el));

        return new class {
            constructor() {
                this.#activate();
            }

            /**
             * Опрацювати неактивовані елементи колекції
             *
             * @returns {this}
             * @private
             */
            #activate() {
                // Деактивувати активовані, щоб оновити конфігурацію
                this.remove();
                // Активувати колекцію
                collection.forEach(ul => {
                    // Об'єкт з публічними полями елемента колекції
                    ul.UI = {};
                    ul.UI.conf = Object.assign({}, defConf, userConf, UI.#getDatasetConf(ul));
                    ul.UI.toggleButton = document.createElement(`i`);
                    ul.UI.toggleButton.classList.add(css.toggleButton);
                    ul.UI.toggleButton.innerHTML = ul.UI.conf.toggleIcon;
                    ul.UI.toggleButton.onclick = () => this.toggleShow(null, ul);
                    ul.UI.subToggleButtons = [];
                    ul.after(ul.UI.toggleButton);
                    ul.querySelectorAll(`:scope ul`).forEach(subUl => {
                        const subToggleButton = document.createElement(`i`);
                        subToggleButton.classList.add(css.subToggleButton);
                        subToggleButton.innerHTML = ul.UI.conf.toggleIcon;
                        subToggleButton.onclick = () => this.toggleShow(null, subUl);
                        ul.UI.subToggleButtons.push(subToggleButton);
                        subUl.before(subToggleButton);
                    });
                    this.markLink(ul);
                    // Помітити елемент як активований
                    UI.#markActivate(ul, selfName);
                });
                return this;
            }

            /**
             * Помітити корінний <li> з дочірньою <a> на поточну сторінку
             *
             * @param {HTMLElement|null} ul Список
             * @returns {this}
             */
            markLink(ul = null) {
                const worker = ul => {
                    if (!ul.UI.conf.markLink) return;
                    const pageLocation = [`${location.pathname}${location.search}`, location.pathname, location.href];
                    ul.querySelectorAll(`:scope a`).forEach(a => {
                        if (pageLocation.includes(a.href))
                            a.closest(`${ul.UI.conf.selector} > li`).classList.add(css.mark);
                    });
                };
                // Опрацювати всю колекцію якщо елемент не передано
                !(ul instanceof HTMLElement) ? collection.forEach(worker) : worker(ul);
                return this;
            }

            /**
             * Перемикання видимості меню.
             * Почергово, чи в залежності від force значення,
             * список буде приховано чи показано
             *
             * @param {boolean|null} force Показати чи сховати меню
             * @param {HTMLElement|null} ul Список
             * @returns {this}
             */
            toggleShow(force = null, ul = null) {
                const worker = ul => {
                    let eventName;
                    if (typeof force === `boolean`) {
                        eventName = force ? `UI.beforeShow` : `UI.beforeHide`;
                        ul.dispatchEvent(new CustomEvent(eventName));
                        ul.classList.toggle(css.show, force);
                        eventName = force ? `UI.showed` : `UI.hidden`;
                        ul.dispatchEvent(new CustomEvent(eventName));
                        return;
                    }
                    eventName = ul.classList.contains(css.show) ? `UI.beforeHide` : `UI.beforeShow`;
                    ul.classList.toggle(css.show)
                        ? ul.dispatchEvent(new CustomEvent(`UI.showed`))
                        : ul.dispatchEvent(new CustomEvent(`UI.hidden`));
                };
                // Опрацювати всю колекцію якщо елемент не передано
                !(ul instanceof HTMLElement) ? collection.forEach(worker) : worker(ul);
                return this;
            }

            /**
             * Деактивувати активовані елементи колекції
             *
             * @return {this}
             */
            remove() {
                collection.filter(el => UI.#isActivate(el, selfName)).forEach(ul => {
                    ul.dispatchEvent(new CustomEvent(`UI.beforeRemove`));
                    // Повернути елементи в стан до активації
                    ul.UI.toggleButton.remove();
                    ul.UI.subToggleButtons.forEach(btn => btn.remove());
                    UI.#unmarkActivate(ul, selfName);
                    delete ul.UI;
                    ul.dispatchEvent(new CustomEvent(`UI.removed`));
                });
                return this;
            }

            /**
             * Отримати активовані елементи колекції
             *
             * @returns {Array}
             */
            get get() {
                return collection.filter(el => UI.#isActivate(el, selfName));
            }
        }
    }
}

/**
 * Виклик методів UI
 *
 * Закоментуй або видали виклик
 * методів що не використовуєш.
 * Авжеж, можеш викликати методи
 * динамічно в файлах з під'єднаним UI
 */
document.addEventListener(`DOMContentLoaded`, () => {
    UI.Tabs();
    UI.GoTo();
    UI.Popup();
    UI.InputFile();
    UI.InputRange();
    UI.InputNumber();
    UI.Select();
    UI.Menu();
});
