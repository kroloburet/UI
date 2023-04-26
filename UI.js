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
     *
     * @param {HTMLElement} el Елемент на якому встановлюється мітка
     * @param {string} selfName Ім'я метода
     * @private
     */
    #markActivate(el, selfName) {
        el.classList.add(`UI_${selfName}-activated`);
    }

    /**
     * Видалити мітку активації метода UI на елементі
     * разом з динамічно створеними CSS-класами
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
            el.uiData ??= {};
            el.uiData.oldClasses = className;
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
            el.className = el.uiData.oldClasses;
            el.uiData.componentBox.before(el);
            el.uiData.componentBox.remove();
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
            controlBox: `UI_${selfName}-control-box`,
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
                // Отримати з uri хешу данні про id табів та індекси вкладок які потрібно відкрити
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
                collection.forEach(tabs => {
                    // Об'єкт з публічними полями елемента колекції
                    tabs.uiData = {};
                    tabs.uiData.conf = Object.assign({}, defConf, userConf, UI.#getDatasetConf(tabs));
                    tabs.uiData.componentBox = tabs;
                    tabs.uiData.controlBox = document.createElement(`div`);
                    tabs.uiData.dtList = tabs.querySelectorAll(`:scope dt`);
                    tabs.uiData.ddList = tabs.querySelectorAll(`:scope dd`);
                    // Додати елементи, класи та слухачів подій
                    tabs.uiData.controlBox.classList.add(css.controlBox, UI.css.noScrollbar);
                    tabs.uiData.controlBox.append(...tabs.uiData.dtList);
                    tabs.uiData.componentBox.prepend(tabs.uiData.controlBox);
                    tabs.uiData.dtList.forEach(
                        (dt, index) => dt.onclick = () => this.show(index, tabs)
                    );
                    // Відкрити вкладку по хешу в uri чи зазначену в конфігурації
                    let showTabIndex = tabs.uiData.conf.showTabIndex;
                    if (tabs.uiData.conf.smartShow && tabs.uiData.componentBox.id && Object.keys(smartSowTabs).length) {
                        if (smartSowTabs[tabs.uiData.componentBox.id]) {
                            showTabIndex = smartSowTabs[tabs.uiData.componentBox.id];
                        }
                    }
                    this.show(showTabIndex, tabs);
                    // Помітити елемент як активований
                    UI.#markActivate(tabs, selfName);
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
                    tabs.uiData.dtList.forEach((dt, index) => {
                        if (dt.classList.contains(css.show)) {
                            tabs.uiData.dtList[index].classList.remove(css.show);
                            tabs.uiData.ddList[index].classList.remove(css.show);
                        }
                    });
                    // Перевірити, чи існує вкладка за індексом та відкрити
                    tabIndex = tabs.uiData.dtList[tabIndex]
                        ? tabIndex
                        : (tabs.uiData.dtList[tabs.uiData.conf.showTabIndex] ? tabs.uiData.conf.showTabIndex : 0);
                    tabs.uiData.dtList[tabIndex].classList.add(css.show);
                    tabs.uiData.ddList[tabIndex].classList.add(css.show);
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
                    // Видалити прив'язку подій та повернути HTML-структуру списку визначень
                    tabs.uiData.dtList.forEach((dt, index) => {
                        dt.onclick = null;
                        tabs.uiData.ddList[index].before(dt);
                    });
                    tabs.uiData.controlBox.remove();
                    UI.#unmarkActivate(tabs, selfName);
                    delete tabs.uiData;
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
            el.style.display = display;
            el.hidden = false;
        } else {
            el.style.display = `none`;
        }
        return el;
    }

    /**
     * Перехід до елементу
     *
     * @param {string|HTMLElement|null} [target = null] Селектор елемента чи елемент
     * @return {undefined|HTMLElement} Елемент
     * @see https://kroloburet.github.io/UI/#goTo
     */
    GoTo(target = null) {
        if (this.#isDisabledNode()) return;
        target = target ?? location.hash;
        if (!target) return;
        const el = target instanceof HTMLElement ? target : document.querySelector(target);
        setTimeout(() => {
            el?.scrollIntoView({
                behavior: `smooth`,
                block: `start`,
            });
        }, 200);
        return el;
    }

    /**
     * Підказка що випливає
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
                if (!el.uiData) {
                    if (!el.nextElementSibling.classList.contains(`UI_${selfName}`))
                        throw ReferenceError(`Hint element mast contain css class "UI_${selfName}"!`);
                    el.uiData = {};
                    el.uiData.hint = el.nextElementSibling;
                    el.addEventListener(`mousemove`, this.setPosition);
                    document.addEventListener(hideEvent, () => this.hide());
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
            setPosition(e = el) {
                const gap = 16;
                const win = window;
                const cursor = {x: e.pageX, y: e.pageY};
                const hintWidth = el.uiData.hint.offsetWidth;
                const hintHeight = el.uiData.hint.offsetHeight;
                // Відстань курсора до правого та нижнього краю
                const distance = {
                    right: win.innerWidth - (cursor.x - win.scrollX),
                    bottom: win.innerHeight - (cursor.y - win.scrollY)
                };
                // Розмістити зліва від курсора, якщо близько до правого краю
                el.uiData.hint.style.left = distance.right < hintWidth
                    ? cursor.x - hintWidth < 0
                        ? 0 // Закріпити з лівого краю, якщо значення від'ємне
                        : `${cursor.x - hintWidth}px`
                    : `${cursor.x + gap}px`;
                // Розмістити над курсором, якщо близько до нижнього краю
                el.uiData.hint.style.top = distance.bottom < (hintHeight + gap)
                    ? `${(cursor.y - gap) - hintHeight}px`
                    : `${cursor.y + gap}px`;
                return this;
            }

            /**
             * Показати підказку
             *
             * @returns {this}
             */
            show() {
                el.uiData.hint.classList.add(css.show);
                return this;
            }

            /**
             * Сховати підказку
             *
             * @returns {this}
             */
            hide() {
                el.uiData.hint.classList.remove(css.show);
                return this;
            }

            /**
             * Видалити дані метода
             *
             * @returns {this}
             */
            remove() {
                delete el.uiData;
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

        // Повідомлення
        let notice = document.querySelector(`.UI_${selfName}`);

        return new class {
            constructor() {
                this.#activate();
            }

            /**
             * Створити повідомлення якщо не створено,
             * опрацювати повідомлення
             *
             * @returns {this}
             * @private
             */
            #activate() {
                const conf = Object.assign({}, defConf, userConf);
                // Повідомлення ще не створено
                if (!notice) {
                    notice = document.createElement(`div`);
                    notice.uiData = {};
                    notice.uiData.componentBox = document.createElement(`div`);
                    notice.uiData.componentBox.classList.add(UI.css.bodyOverlay, css.box);
                    notice.uiData.componentBox.prepend(notice);
                    document.body.classList.add(UI.css.bodyHideOverflow);
                    document.body.append(notice.uiData.componentBox);
                }
                // Повідомлення створено
                notice.classList.add(`UI_${selfName}`, conf.className);
                notice.innerHTML = conf.message;
                if (conf.delay) {
                    setTimeout(async () => {
                        this.remove();
                        if (typeof conf.callback === `function`) await conf.callback();
                    }, conf.delay)
                }
                return this;
            }

            /**
             * Деактивувати повідомлення
             *
             * @return {this}
             */
            remove() {
                if (!notice) return this;
                notice.uiData.componentBox.remove();
                document.body.classList.remove(UI.css.bodyHideOverflow);
                delete notice.uiData;
                return this;
            }

            /**
             * Отримати повідомлення
             *
             * @returns {HTMLElement}
             */
            get get() {
                return notice;
            }
        }
    }

    /**
     * Popup вікно
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
            closeBtn: `UI_${selfName}-close-btn`,
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
                        pop.uiData = {};
                        pop.uiData.componentBox = document.createElement(`div`);
                        pop.uiData.closeBtn = document.createElement(`span`);
                        pop.uiData.componentBox.classList.add(UI.css.bodyOverlay, css.box);
                        pop.uiData.componentBox.onclick = e =>
                            e.target === pop.uiData.componentBox ? this.hide() : null;
                        pop.uiData.closeBtn.classList.add(css.closeBtn, `fa-solid`, `fa-times-circle`);
                        pop.uiData.closeBtn.onclick = this.hide;
                        pop.prepend(pop.uiData.closeBtn);
                        pop.uiData.componentBox.prepend(pop);
                        document.body.append(pop.uiData.componentBox);
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
                pop.uiData.componentBox.classList.add(css.show);
                document.body.classList.add(UI.css.bodyHideOverflow);
                return this;
            }

            /**
             * Сховати всі popup
             *
             * @returns {this}
             */
            hide() {
                collection.filter(el => UI.#isActivate(el, selfName))
                    .forEach(pop => pop.uiData.componentBox.classList.remove(css.show));
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
                if (!field.uiData) {
                    if (![`INPUT`, `TEXTAREA`].includes(field.tagName) && ![`text`, `textarea`].includes(field.type))
                        throw TypeError(`Expected: HTMLElement INPUT or TEXTAREA in "trigger" argument.`);
                    if (isNaN(limit))
                        throw TypeError(`Expected: type number in "limit" argument.`);
                    if (UI.#isDisabledNode(field)) return;
                    field.uiData = {};
                    field.uiData.limit = parseInt(limit, 10);
                    field.uiData.componentBox = UI.#formComponent.wrap(field);
                    field.uiData.counter = document.createElement(`span`);
                    field.uiData.counter.textContent = limit.toString();
                    field.uiData.counter.classList.add(`UI_${selfName}`);
                    field.after(field.uiData.counter);
                    field.addEventListener('blur', () => {
                        this.cut().hide();
                    });
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
                if (field.value.length <= field.uiData.limit) {
                    field.uiData.counter.textContent = (field.uiData.limit - field.value.length).toString();
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
                field.after(field.uiData.counter);
                field.focus();
                return this;
            }

            /**
             * Відкріпити лічильник від поля
             *
             * @returns {this}
             */
            hide() {
                field.uiData.counter.remove();
                return this;
            }

            /**
             * Обрізати рядок в полі до ліміту
             *
             * @returns {this}
             */
            cut() {
                field.value = field.value.substring(0, field.uiData.limit);
                field.uiData.counter.textContent = `0`;
                return this;
            }

            /**
             * Видалити лічильник
             *
             * @returns {this}
             */
            remove() {
                UI.#formComponent.unwrap(field);
                delete field.uiData;
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
     * @param {Object} userConf Конфігурація користувача
     * @param {string} [userConf.selector = `UI_InputFile`] Селектор input type="file" елемента/тів для опрацювання
     * @param {string} [userConf.placeholder = `Choose a file`] Текст в полі компонента, якщо файл не обрано
     * @param {string} [userConf.selectIcon = `📂`] Текст або HTML-іконки обрання файла/лів
     * @return {Object} Клас-будівельник
     * @see https://kroloburet.github.io/UI/#inputFile
     */
    InputFile(userConf = {}) {
        // Ім'я методу
        const selfName = `InputFile`;

        // CSS селектори які використовує метод
        const css = {
            controlBox: `UI_${selfName}-control-box`,
            controlBoxItem: `UI_${selfName}-control-box-item`,
            controlBoxItemText: `UI_${selfName}-control-box-item-text`,
            controlBoxPlaceholder: `UI_${selfName}-control-box-placeholder`,
        };

        // Конфігурація за замовчуванням
        const defConf = {
            selector: `.UI_${selfName}`,
            placeholder: `Choose a file`,
            selectIcon: `<i class="fa-solid fa-folder-open">`,
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
                    input.uiData = {};
                    input.uiData.conf = Object.assign({}, defConf, userConf, UI.#getDatasetConf(input));
                    input.uiData.componentBox = UI.#formComponent.wrap(input);
                    input.uiData.selectBtn = document.createElement(`span`);
                    input.uiData.controlBox = document.createElement(`div`);
                    input.uiData.placeholder = document.createElement(`span`);
                    input.uiData.hasMultiple = input.multiple;
                    // Додати елементи, класи та слухачів подій
                    if (input.form) {
                        input.uiData.resetHandler = () => setTimeout(() => this.render(input), 100);
                        input.form.addEventListener(`reset`, input.uiData.resetHandler);
                    }
                    input.onchange = () => {
                        this.render(input);
                        input.uiData.controlBox.classList.add(UI.css.focusForm);
                        input.uiData.controlBox.classList.remove(UI.css.invalidForm);
                    };
                    input.oninvalid = () => input.uiData.controlBox.classList.add(UI.css.invalidForm);
                    input.onblur = () => input.uiData.controlBox.classList.remove(UI.css.focusForm);
                    input.uiData.controlBox.classList.add(css.controlBox, UI.css.noScrollbar);
                    input.uiData.selectBtn.classList.add(UI.css.formComponentControl);
                    input.uiData.selectBtn.innerHTML = input.uiData.conf.selectIcon;
                    input.uiData.placeholder.classList.add(css.controlBoxPlaceholder);
                    input.uiData.placeholder.textContent = input.uiData.conf.placeholder;
                    input.after(input.uiData.selectBtn);
                    input.before(input.uiData.controlBox);
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
                    input.uiData.controlBox.innerHTML = ``;
                    input.uiData.componentBox.removeAttribute(`title`);
                    let files = input.files;
                    let totalSize = 0;
                    if (files && files.length) {
                        [...files].forEach(file => {
                            let controlBoxItem = document.createElement(`span`);
                            let controlBoxItemText = document.createElement(`span`);
                            controlBoxItem.classList.add(css.controlBoxItem);
                            controlBoxItemText.classList.add(css.controlBoxItemText);
                            controlBoxItemText.textContent = file.name;
                            controlBoxItem.append(controlBoxItemText);
                            input.uiData.controlBox.append(controlBoxItem);
                            totalSize += file.size;
                        });
                        input.uiData.componentBox.title = `Total size: ${(totalSize / 1048576).toFixed(3)} Mb`;
                    } else {
                        input.uiData.controlBox.append(input.uiData.placeholder);
                    }
                    input.uiData.controlBox.classList.toggle(UI.css.requiredForm, input.required);
                    input.uiData.componentBox.classList.toggle(UI.css.disabledForm, input.disabled);
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
                    // Повернути елементи в стан до активації
                    input.onchange = null;
                    input.oninvalid = null;
                    input.onblur = null;
                    if (input.form) input.form.removeEventListener(`reset`, input.uiData.resetHandler);
                    UI.#unmarkActivate(input, selfName);
                    UI.#formComponent.unwrap(input);
                    delete input.uiData;
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
                    input.uiData = {};
                    input.uiData.conf = Object.assign({}, defConf, userConf, UI.#getDatasetConf(input));
                    // Додати елементи, класи та слухачів подій
                    input.uiData.componentBox = UI.#formComponent.wrap(input);
                    input.uiData.infobox = document.createElement(`span`);
                    input.uiData.infobox.classList.add(UI.css.formComponentControl, css.infobox);
                    input.uiData.infobox.innerText = input.value || `0`;
                    input.after(input.uiData.infobox);
                    if (input.disabled) {
                        input.uiData.componentBox.classList.add(UI.css.disabledForm);
                        input.value = parseFloat(input.min) || 0;
                    } else {
                        input.oninput = () => input.uiData.infobox.innerText = input.value;
                    }
                    if (input.form) {
                        input.uiData.resetHandler = () =>
                            setTimeout(() => input.uiData.infobox.innerText = input.value || `0`, 100);
                        input.form.addEventListener(`reset`, input.uiData.resetHandler);
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
                    // Повернути елементи в стан до активації
                    input.oninput = null;
                    if (input.form) input.form.removeEventListener(`reset`, input.uiData.resetHandler)
                    UI.#unmarkActivate(input, selfName);
                    UI.#formComponent.unwrap(input);
                    delete input.uiData;
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
                    input.uiData = {};
                    input.uiData.conf = Object.assign({}, defConf, userConf, UI.#getDatasetConf(input));
                    input.uiData.componentBox = UI.#formComponent.wrap(input);
                    input.uiData.incBtn = document.createElement(`span`);
                    input.uiData.decBtn = document.createElement(`span`);
                    input.uiData.changeEvent = new Event(`change`);
                    input.uiData.hasDisabled = (input.disabled || input.readOnly);
                    input.uiData.step = () => parseFloat(input.step) || 1;
                    input.uiData.max = () => parseFloat(input.max);
                    input.uiData.min = () => parseFloat(input.min);
                    input.uiData.val = () => parseFloat(input.value);
                    input.uiData.up = () => input.uiData.val() + input.uiData.step();
                    input.uiData.down = () => input.uiData.val() - input.uiData.step();
                    input.uiData.setValid = () => input.classList.remove(UI.css.invalidForm);
                    input.uiData.setInvalid = () => input.classList.add(UI.css.invalidForm);
                    input.uiData.initVal = () => {
                        if (!input.uiData.hasDisabled && isNaN(input.uiData.val())) {
                            input.value = (input.value || input.uiData.min() || input.uiData.max() || 0);
                        }
                    };
                    // Додати елементи, класи та слухачів подій
                    input.uiData.componentBox.title = input.uiData.conf.title;
                    input.uiData.incBtn.classList.add(UI.css.formComponentControl, css.inc);
                    input.uiData.decBtn.classList.add(UI.css.formComponentControl, css.dec);
                    input.uiData.incBtn.innerHTML = input.uiData.conf.incIcon;
                    input.uiData.decBtn.innerHTML = input.uiData.conf.decIcon;
                    input.after(input.uiData.decBtn, input.uiData.incBtn);
                    input.uiData.incBtn.onclick = e => {
                        e.preventDefault();
                        this.setVal(`inc`, input);
                    };
                    input.uiData.decBtn.onclick = e => {
                        e.preventDefault();
                        this.setVal(`dec`, input);
                    };
                    input.oninput = () => {
                        let max = input.uiData.max();
                        let min = input.uiData.min();
                        let val = input.uiData.val();
                        if (input.uiData.hasDisabled) {
                            input.value = min;
                            return;
                        }
                        input.uiData.setValid();
                        if (isNaN(val)) input.uiData.setInvalid();
                        else if (!isNaN(max) && val > max) input.value = max;
                        else if (!isNaN(min) && val < min) input.value = min;
                    };
                    input.uiData.initVal();
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
                    if (input.uiData.hasDisabled) return;
                    input.uiData.initVal();
                    input.uiData.setValid();
                    if (action === `inc`) {
                        let max = input.uiData.max();
                        let up = input.uiData.up();
                        input.value = isNaN(max) ? up : max > up ? up : max;
                    } else if (action === `dec`) {
                        let min = input.uiData.min();
                        let down = input.uiData.down();
                        input.value = isNaN(min) ? down : min < down ? down : min;
                    }
                    input.dispatchEvent(input.uiData.changeEvent);
                    input.focus();
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
                    // Повернути елементи в стан до активації
                    input.oninput = null;
                    UI.#unmarkActivate(input, selfName);
                    UI.#formComponent.unwrap(input);
                    delete input.uiData;
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
     * @param {Object} userConf Конфігурація користувача
     * @param {string} [userConf.selector = `UI_Select`] Селектор select елемента/тів для опрацювання
     * @param {boolean} [userConf.withSearch = true] Чи потрібен в компоненті пошук по опціях спаску
     * @param {string} [userConf.selectPlaceholder = `Make a choice`] Заповнювач порожнього поля списку
     * @param {string} [userConf.searchPlaceholder = `Search on the list`] Заповнювач порожнього поля пошуку по опціях списку
     * @param {string} [userConf.arrowIconDown = `˅`] Іконка кнопки, що показує dropdown компонента. Може містити HTML
     * @param {string} [userConf.arrowIconUp = `˄`] Іконка кнопки, що ховає dropdown компонента. Може містити HTML
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
            arrowIconDown: `<i class="fa-solid fa-chevron-down"></i>`,
            arrowIconUp: `<i class="fa-solid fa-chevron-up"></i>`,
            delItemIcon: `<i class="fa-solid fa-xmark"></i>`,
        };

        // CSS селектори які використовує метод
        const css = {
            overlay: `UI_${selfName}-overlay`,
            dropdown: `UI_${selfName}-dropdown`,
            dropdownList: `UI_${selfName}-dropdown-list`,
            dropdownItem: `UI_${selfName}-dropdown-item`,
            dropdownShow: `UI_${selfName}-dropdown-show`,
            controlBox: `UI_${selfName}-control-box`,
            controlBoxItem: `UI_${selfName}-control-box-item`,
            controlBoxItemMultiply: `UI_${selfName}-control-box-item-multiple`,
            controlBoxItemText: `UI_${selfName}-control-box-item-text`,
            controlBoxItemDel: `UI_${selfName}-control-box-item-del`,
            controlBoxPlaceholder: `UI_${selfName}-control-box-placeholder`,
            selectSearchInput: `UI_${selfName}-search-input`,
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
                    select.uiData = {};
                    select.uiData.conf = Object.assign({}, defConf, userConf, UI.#getDatasetConf(select));
                    select.uiData.componentBox = UI.#formComponent.wrap(select);
                    select.uiData.overlay = document.createElement(`div`);
                    select.uiData.controlBox = document.createElement(`div`);
                    select.uiData.searchInput = document.createElement(`input`);
                    select.uiData.dropdown = document.createElement(`div`);
                    select.uiData.dropdownList = document.createElement(`div`);
                    select.uiData.dropdownShowBtn = document.createElement(`span`);
                    select.uiData.changeEvent = new Event(`change`);
                    select.uiData.hasDisabled = select.disabled;
                    select.uiData.hasMultiple = select.multiple;
                    select.uiData.hasSearch = select.uiData.conf.withSearch;
                    select.uiData.dropdownItems = [];
                    select.uiData.controlBoxPlaceholder;
                    // Побудувати компонент
                    select.uiData.dropdownShowBtn.classList.add(UI.css.formComponentControl);
                    select.uiData.dropdownShowBtn.innerHTML = select.uiData.conf.arrowIconDown;
                    select.uiData.dropdown.classList.add(css.dropdown);
                    select.uiData.dropdownList.classList.add(css.dropdownList, UI.css.scrollbar);
                    select.uiData.controlBox.classList.add(css.controlBox, UI.css.noScrollbar);
                    select.uiData.overlay.classList.add(css.overlay)
                    select.before(select.uiData.controlBox);
                    select.after(select.uiData.dropdown, select.uiData.dropdownShowBtn);
                    select.uiData.dropdown.append(select.uiData.dropdownList);
                    if (select.uiData.hasSearch) {
                        select.uiData.searchInput.type = `text`;
                        select.uiData.searchInput.classList.add(css.selectSearchInput);
                        select.uiData.searchInput.placeholder = select.uiData.conf.searchPlaceholder;
                        select.uiData.searchInput.oninput = () => this.search(select.uiData.searchInput.value, select);
                        select.uiData.dropdown.prepend(select.uiData.searchInput);
                    }
                    let hasDefaultSelected = [...select.options].filter(opt => opt.defaultSelected).length;
                    if (select.uiData.conf.selectPlaceholder && !hasDefaultSelected) select.selectedIndex = -1;
                    this.render(select);
                    // Слухачі подій для показу та приховування dropdown
                    select.uiData.overlay.onclick = () => this.hideDropdown(select);
                    select.uiData.componentBox.onclick = e => {
                        let control = [
                            select.uiData.controlBox,
                            select.uiData.controlBoxItemText,
                            select.uiData.controlBoxPlaceholder,
                            select.uiData.dropdownShowBtn,
                            select.uiData.dropdownShowBtn.firstChild,
                        ].includes(e.target);
                        if (control) {
                            let show = select.uiData.dropdown.classList.contains(css.dropdownShow);
                            show ? this.hideDropdown(select) : this.showDropdown(select);
                        }
                    };
                    // Слухачі подій поля
                    select.oninvalid = () => select.uiData.controlBox.classList.add(UI.css.invalidForm);
                    if (select.form) {
                        select.uiData.resetHandler = () => setTimeout(() => this.render(select), 100);
                        select.form.addEventListener(`reset`, select.uiData.resetHandler);
                    }
                    // Помітити елемент як активований
                    UI.#markActivate(select, selfName);
                });
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
                    if (!select.uiData.conf.selectPlaceholder) return;
                    select.selectedIndex = -1;
                    select.data = select.uiData.hasMultiple ? [] : ``;
                    select.uiData.controlBox.innerHTML = ``;
                    select.uiData.controlBoxPlaceholder = document.createElement(`span`);
                    select.uiData.controlBoxPlaceholder.classList.add(css.controlBoxPlaceholder);
                    select.uiData.controlBoxPlaceholder.textContent = select.uiData.conf.selectPlaceholder;
                    select.uiData.controlBox.prepend(select.uiData.controlBoxPlaceholder);
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
                    if (select.uiData.hasDisabled || !select.uiData.dropdownItems.length) return;
                    const dropdown = select.uiData.dropdown;
                    const dropdownDistanceToBtm = window.innerHeight - dropdown.getBoundingClientRect().bottom;
                    const dropdownDistanceToTop = dropdown.getBoundingClientRect().top;
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
                    if (select.uiData.hasDisabled || !select.uiData.dropdownItems.length) return;
                    select.after(select.uiData.overlay);
                    select.uiData.controlBox.classList.contains(UI.css.invalidForm)
                        ? select.uiData.controlBox.classList.replace(UI.css.invalidForm, UI.css.focusForm)
                        : select.uiData.controlBox.classList.add(UI.css.focusForm);
                    select.uiData.dropdown.classList.add(css.dropdownShow);
                    select.uiData.dropdownShowBtn.innerHTML = select.uiData.conf.arrowIconUp;
                    this.#setDropdownPosition(select);
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
                    if (!select.uiData || select.uiData.hasDisabled) return;
                    select.uiData.overlay.remove();
                    select.uiData.componentBox.style.zIndex = `auto`;
                    select.uiData.dropdown.classList.remove(css.dropdownShow);
                    select.uiData.controlBox.classList.remove(UI.css.focusForm);
                    select.uiData.dropdownShowBtn.innerHTML = select.uiData.conf.arrowIconDown;
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
                        select.uiData.hasDisabled ||
                        !select.uiData.hasSearch ||
                        !select.uiData.dropdownItems.length
                    ) return;
                    const q = query.toLowerCase();
                    select.uiData.dropdownItems.forEach((item, index) => {
                        item.hidden = !(
                            item.textContent.toLowerCase().indexOf(q) > -1 ||
                            select.options[index].dataset.findOf?.toLowerCase().indexOf(q) > -1
                        );
                    });
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
                    if (select.uiData.hasDisabled) return;
                    for (let index of indexes) {
                        let option = select.item(index);
                        if (option.disabled || (!select.uiData.hasMultiple && index !== indexes[0])) break;
                        option.selected = val;
                    }
                    this.render(select);
                    if (!select.uiData.hasMultiple || !select.uiData.dropdownItems.length) this.hideDropdown(select);
                    select.dispatchEvent(select.uiData.changeEvent);
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
                    // Обнулити дані
                    let data = select.uiData.hasMultiple ? [] : ``;
                    select.uiData.controlBox.innerHTML = ``;
                    select.uiData.dropdownList.innerHTML = ``;
                    select.uiData.dropdownItems = [];
                    [...select.options].forEach(option => {
                        // Додати опцію у dropdown
                        if (!option.selected && !option.disabled) {
                            let dropdownItem = document.createElement(`div`);
                            dropdownItem.classList.add(css.dropdownItem);
                            dropdownItem.innerHTML = option.dataset.content || option.textContent;
                            dropdownItem.onclick = () => this.selected(true, [option.index], select);
                            select.uiData.dropdownItems[option.index] = dropdownItem;
                            select.uiData.dropdownList.append(dropdownItem);
                        }
                        // Додати як обрані
                        if (option.selected) {
                            let controlBoxItem = document.createElement(`span`);
                            let controlBoxItemText = document.createElement(`span`);
                            let controlBoxItemClass = select.uiData.hasMultiple
                                ? css.controlBoxItemMultiply
                                : css.controlBoxItem;
                            select.uiData.hasMultiple ? data.push(option.value) : data = select.value;
                            controlBoxItem.classList.add(controlBoxItemClass);
                            controlBoxItemText.classList.add(css.controlBoxItemText);
                            controlBoxItemText.innerHTML = option.dataset.content || option.textContent;
                            controlBoxItemText.onclick = () => this.showDropdown(select);
                            controlBoxItem.append(controlBoxItemText);
                            select.uiData.controlBox.append(controlBoxItem);
                            if (select.uiData.hasMultiple) {
                                let controlBoxItemDel = document.createElement(`span`);
                                controlBoxItemDel.classList.add(css.controlBoxItemDel);
                                controlBoxItemDel.innerHTML = select.uiData.conf.delItemIcon;
                                controlBoxItemDel.onclick = () => this.selected(false, [option.index], select);
                                controlBoxItem.append(controlBoxItemDel);
                            }
                        }
                    });
                    // Додати placeholder
                    if (!select.value) this.#addPlaceholder(select);
                    //
                    select.uiData.controlBox.classList.toggle(UI.css.requiredForm, select.required);
                    select.uiData.componentBox.classList.toggle(UI.css.disabledForm, select.uiData.hasDisabled);
                    // Якщо є запит, показати результат пошуку
                    let searchVal = select.uiData.searchInput?.value;
                    if (searchVal) this.search(searchVal, select);
                    // Додати властивість полю для отримання значення {Array|String}
                    select.data = data;
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
                    // Повернути елементи в стан до активації
                    select.oninvalid = null;
                    if (select.form) select.form.removeEventListener(`reset`, select.uiData.resetHandler);
                    UI.#unmarkActivate(select, selfName);
                    UI.#formComponent.unwrap(select);
                    delete select.data;
                    delete select.uiData;
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
     * @param {Object} userConf Конфігурація користувача
     * @param {string} [userConf.selector = `UI_Menu`] Селектор ul елемента/тів для опрацювання
     * @param {string} [userConf.btnIcon = `☰`] Іконка кнопки, яка покаже/сховає меню на малих пристроях. Може містити HTML.
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
            showBtn: `UI_${selfName}-show-btn`,
            showSubBtn: `UI_${selfName}-show-sub-btn`,
            mark: `UI_${selfName}-mark`,
        };

        // Конфігурація за замовчуванням
        const defConf = {
            selector: `.UI_${selfName}`,
            btnIcon: `&#8801;`,
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
                    ul.uiData = {};
                    ul.uiData.conf = Object.assign({}, defConf, userConf, UI.#getDatasetConf(ul));
                    ul.uiData.showBtn = document.createElement(`i`);
                    ul.uiData.showBtn.classList.add(css.showBtn);
                    ul.uiData.showBtn.innerHTML = ul.uiData.conf.btnIcon;
                    ul.uiData.showBtn.onclick = () => this.toggleShow(null, ul);
                    ul.uiData.showSubBtns = [];
                    ul.after(ul.uiData.showBtn);
                    ul.querySelectorAll(`:scope ul`).forEach(subUl => {
                        const showSubBtn = document.createElement(`i`);
                        showSubBtn.classList.add(css.showSubBtn);
                        showSubBtn.innerHTML = ul.uiData.conf.btnIcon;
                        showSubBtn.onclick = () => this.toggleShow(null, subUl);
                        ul.uiData.showSubBtns.push(showSubBtn);
                        subUl.before(showSubBtn);
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
                    if (!ul.uiData.conf.markLink) return;
                    const pageLocation = [`${location.pathname}${location.search}`, location.pathname, location.href];
                    ul.querySelectorAll(`:scope a`).forEach(a => {
                        if (pageLocation.includes(a.href))
                            a.closest(`${ul.uiData.conf.selector} > li`).classList.add(css.mark);
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
                    if (typeof force === `boolean`) {
                        ul.classList.toggle(css.show, force);
                        return;
                    }
                    ul.classList.toggle(css.show);
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
                    ul.uiData.showBtn.remove();
                    ul.uiData.showSubBtns.forEach(btn => btn.remove());
                    UI.#unmarkActivate(ul, selfName);
                    delete ul.uiData;
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
