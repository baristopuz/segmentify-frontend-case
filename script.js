class SegmentifyProductFilterify {
    constructor() {
        this.CSSClass = {
            prevBtn: '.prev-btn',
            nextBtn: '.next-btn',
        };
        this.questions = [];
        this.products = [];
        this.activeStep = 0;
        this.maxStep = null;
        this.isTheActiveQuestionAnswered = false;
        this.selectedValues = [];
        this.init();
    }

    async init() {
        this.products = await this.getJSON('./api/v1/products.json')
        this.questions = await this.getJSON('./api/v1/questions.json')
        this.maxStep = this.questions.length;
        this.getFirstStep();
        this.handleEvents();
        this.createQuestionSteps();
        this.ready();
    }

    async getJSON(url) {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    }

    getFirstStep() {
        const questionStep = this.questions[0]?.steps.find(step => step.type === "question");
        let html = this.generateHTML('question', questionStep, 0);
        this.renderHTML(html);
        return questionStep;
    }

    ready() {
        let app = document.querySelector('.segmentify-product-filterify');
        app.classList.add('ready');
    }

    getStep(action) {
        if (action === 'next' && !this.isTheActiveQuestionAnswered && this.activeStep != this.maxStep) {
            return;
        }

        if (action == 'prev') {
            if (this.activeStep != 0) {
                this.activeStep--;
                this.renderStep();
                this.setSelectedValue();
            }
            this.updateQuestionStepBullet();

        }

        if (action == 'next') {
            if (this.activeStep < this.maxStep) {
                this.activeStep++;
                this.isTheActiveQuestionAnswered = false;
            }

            this.updateQuestionStepBullet();

            if (this.activeStep != this.maxStep) {
                this.renderStep();
                this.setSelectedValue();
            }

            if (this.activeStep == this.maxStep) {
                const filteredProducts = this.filterProducts(this.products, this.selectedValues);
                if (filteredProducts.length) {
                    let productHTML = this.generateProductHTML(filteredProducts);
                    this.renderProductHTML(productHTML);
                    this.initSwiper();
                } else {
                    let productHTML = this.generateProductEmptyHTML();
                    this.renderProductHTML(productHTML);
                }
            }
        }
    }

    renderStep() {
        const questionStep = this.questions?.find(question => question.name === this.selectedValues[0].value);
        let html = this.generateHTML(questionStep.steps[this.activeStep].type, questionStep.steps[this.activeStep], this.activeStep);
        this.renderHTML(html);
    }

    setSelectedValue() {
        let existingSelectionIndex = this.selectedValues.findIndex(selection => selection.step == this.activeStep);
        let selectedValue = this.selectedValues[existingSelectionIndex];

        if (selectedValue) {
            let buttons = document.querySelectorAll('.questions-list button');

            buttons.forEach(button => {
                if (button.textContent == selectedValue.value) button.classList.add("selected");
            });
        }

    }

    createQuestionSteps() {
        let html = '';
        for (let i = 0; i < this.maxStep; i++) {
            html += `<div class="question-step-bullet ${i == 0 ? 'active' : ''}" step="${i}"></div>`;
        }
        let questionStepContainer = document.querySelector('.question-steps');
        questionStepContainer.innerHTML = html;
    }


    updateQuestionStepBullet() {
        let steps = document.querySelectorAll('.question-step-bullet');
        steps.forEach(step => {
            step.classList.remove("active");
        });

        let activeStepBullet = document.querySelector(`.question-step-bullet[step="${this.activeStep}"]`);
        activeStepBullet?.classList.add("active");

        let questionStepContainer = document.querySelector('.question-steps');

        if (this.activeStep == this.maxStep) {
            questionStepContainer.style.display = "none";
        } else {
            questionStepContainer.style.display = "flex";
        }

    }

    setStates() {
        let selectedButton = document.querySelector('.questions-list button.selected');

        if (selectedButton) {
            this.isTheActiveQuestionAnswered = true;

            let questionBlock = document.querySelector('.question-block');
            let questionBlockType = questionBlock.getAttribute('type');
            let questionBlockStep = questionBlock.getAttribute('step');

            let existingSelectionIndex = this.selectedValues.findIndex(selection => selection.step == questionBlockStep);

            if (existingSelectionIndex !== -1) {
                this.selectedValues[existingSelectionIndex].value = selectedButton.textContent;
            } else {
                this.selectedValues.push({
                    step: Number(questionBlockStep),
                    type: questionBlockType,
                    value: selectedButton.textContent
                });
            }
        }
    }

    handleEvents() {
        let _this = this;

        document.addEventListener('click', function (event) {
            if (event.target.closest('.question-buttons button')) {
                let buttons = document.querySelectorAll('.question-buttons button');

                buttons.forEach(btn => {
                    btn.classList.remove('selected');
                });

                event.target.classList.add('selected');
            }

            if (event.target.closest('.question-control-buttons button')) {
                let btn = event.target.closest('button');
                let btnType = btn.getAttribute('action');

                if (btnType == 'prev') {
                    _this.getStep('prev');
                }

                if (btnType == 'next') {
                    _this.setStates();
                    _this.getStep('next');
                }
            }
        });
    }

    generateHTML(type, data, step) {
        let html = '';

        html = `
        <div class="question-block" type="${type}" step="${step}">
            ${data.subtitle ? `<h2 class="question-subtitle">${data.subtitle}</h2>` : ''}
            <h2 h2 class="question-title" > ${data.title}</h2 >
                <div class="question-buttons">
                    ${data.answers?.map(answer => `<button ${type == 'color' ? `color="${answer.toLowerCase()}"` : ''} type="button">${answer}</button>`).join('')}
                </div>
        </div >
            `;
        return html;
    }

    renderHTML(html) {
        let questionList = document.querySelector('.questions-list');
        questionList.innerHTML = html;
    }

    generateProductHTML(products) {
        let html = `
        <!-- Slider main container -->
        <div class="swiper product-swiper">
            <!-- Additional required wrapper -->
            <div class="swiper-wrapper">
                <!-- Slides -->
                ${products?.map(product => `
                <div class="swiper-slide">
                    <div class="product-card-container">
                    <div class="product-card">
                        <div class="product-card-image">
                            <img src="${product.image}" alt="" />
                        </div>
                        <h2 class="product-card-title">${product.name}</h2>
                        ${product.oldPrice ? `<p class="product-card-price">${product.currency}${product.oldPrice}</p>` : ''}
                        <p class="product-card-discounted-price">${product.currency}${product.price}</p>
                        <a class="product-card-button" target="_blank" href="${product.url}">Vıew Product</a>
                    </div>
                    </div>
                </div>
                `).join('')}
            </div>
            <div class="swiper-pagination"></div>

            <div class="swiper-button-prev">
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 12H4m0 0l6-6m-6 6l6 6"/></svg>
            </div>
            <div class="swiper-button-next">
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 12h16m0 0l-6-6m6 6l-6 6"/></svg>
            </div>
        </div>
        `;
        return html;
    }

    generateProductEmptyHTML() {
        let html = `
            <div style="text-align: center;">Products Not Found!</div>
        `;
        return html;
    }

    renderProductHTML(html) {
        let productList = document.querySelector('.questions-list');
        productList.innerHTML = html;
    }

    filterProducts(products, selectedValues) {
        return products.filter(product => {
            const colorFilter = selectedValues.find(filter => filter.type === 'color');
            if (colorFilter && !product.colors.includes(colorFilter.value.toLowerCase())) {
                return false;
            }

            const priceFilter = selectedValues.find(filter => filter.type === 'price');
            if (priceFilter && (product.price < parseInt(priceFilter.value.split('-')[0]) || product.price > parseInt(priceFilter.value.split('-')[1]))) {
                return false;
            }

            const categoryFilter = selectedValues.find(filter => filter.type === 'question');
            if (categoryFilter && product.category.includes(categoryFilter.value)) {
                return false;
            }

            return true;
        });
    }

    initSwiper() {
        var swiper = new Swiper(".product-swiper", {
            spaceBetween: 40,
            navigation: {
                nextEl: ".swiper-button-next",
                prevEl: ".swiper-button-prev",
            },
            pagination: {
                el: ".swiper-pagination",
                clickable: true
            },
        });
    }
}

let app = new SegmentifyProductFilterify();