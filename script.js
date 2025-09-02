// Глобальные переменные
let clientId = null;

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initNavigation();
    initFAQ();
    initAnimations();
    initFormHandling();
    initScrollEffects();
    initAnimatedStories();
    
    // Получаем Yandex client ID
    getYandexClientId();
});

// Получаем Yandex client ID при загрузке страницы
function getYandexClientId() {
    if (typeof window !== 'undefined' && window.ym) {
        window.ym(103573073, 'getClientID', function (id) {
            console.log('Yandex clientID:', id);
            clientId = id;
        });
    }
}

// Navigation functionality
function initNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking on links
    const navLinksItems = document.querySelectorAll('.nav-links a');
    navLinksItems.forEach(link => {
        link.addEventListener('click', function() {
            navLinks.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });
    
    // Header scroll effect
    const header = document.querySelector('.header');
    let lastScroll = 0;
    
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
            header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.boxShadow = 'none';
        }
        
        lastScroll = currentScroll;
    });
}

// FAQ functionality
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', function() {
            const isActive = item.classList.contains('active');
            
            // Close all FAQ items
            faqItems.forEach(faqItem => {
                faqItem.classList.remove('active');
            });
            
            // Open clicked item if it wasn't active
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
}

// Animations on scroll
function initAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll('.service-card, .step, .pricing-card, .story-card, .trust-item');
    animateElements.forEach(el => {
        observer.observe(el);
    });
}

// Form handling
function initFormHandling() {
    const basicForm = document.getElementById('basicBusinessPlanForm');
    const premiumForm = document.getElementById('premiumBusinessPlanForm');
    const quickQuestionForm = document.querySelector('.contact-form');
    
    if (basicForm) {
        basicForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleBasicFormSubmission();
        });
    }
    
    if (premiumForm) {
        premiumForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handlePremiumFormSubmission();
        });
    }
    
    if (quickQuestionForm) {
        quickQuestionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleQuickQuestionSubmission();
        });
    }
    
    // Auto-select package when clicking pricing buttons
    const pricingButtons = document.querySelectorAll('.pricing-card button');
    pricingButtons.forEach(button => {
        button.addEventListener('click', function() {
            const packageType = this.getAttribute('onclick').match(/'([^']+)'/)[1];
            selectPlan(packageType);
        });
    });
}

// Handle basic form submission (without idea)
function handleBasicFormSubmission() {
    const form = document.getElementById('basicBusinessPlanForm');
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    // Показываем состояние загрузки
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
    submitBtn.disabled = true;
    
    // Собираем данные формы
    const formData = new FormData(form);
    const data = {
        email: formData.get('email'),
        fullName: formData.get('fullName'),
        location: formData.get('location'),
        ownInvestment: formData.get('ownInvestment'),
        additionalInfo: formData.get('additionalInfo'),
        source_url: window.location.href,
        form: 'general_no_idea',
        price: '2690',
        yandex_client_id: clientId
    };
    
    // Отправляем запрос на API
    fetch('https://app.zakazat-biznesplan.online/create-order', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            // Пытаемся получить детальную информацию об ошибке
            if (response.status === 400) {
                throw new Error('Неверные данные формы');
            } else if (response.status === 500) {
                throw new Error('Ошибка сервера');
            } else {
                throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
            }
        }
        return response.json();
    })
    .then(result => {
        console.log('Успешно отправлено:', result);
        
        // Проверяем, есть ли URL для подтверждения
        if (result.confirmation_url) {
            // Выполняем редирект на страницу подтверждения
            console.log('Выполняем редирект на:', result.confirmation_url);
            window.location.href = result.confirmation_url;
        } else {
            // Если URL нет, показываем уведомление об успехе
            showNotification('Успешно! Ваша заявка на базовый пакет отправлена. Мы свяжемся с вами в ближайшее время.', 'success');
            form.reset();
        }
    })
    .catch(error => {
        console.error('Ошибка отправки:', error);
        let errorMessage = 'Произошла ошибка при отправке. Попробуйте еще раз или свяжитесь с нами.';
        
        // Пытаемся получить более детальную информацию об ошибке
        if (error.message) {
            errorMessage = `Ошибка: ${error.message}`;
        }
        
        showNotification(errorMessage, 'error');
    })
    .finally(() => {
        // Восстанавливаем кнопку только если не произошел редирект
        if (!window.location.href.includes('confirmation')) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Handle premium form submission (with idea)
function handlePremiumFormSubmission() {
    const form = document.getElementById('premiumBusinessPlanForm');
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    // Показываем состояние загрузки
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
    submitBtn.disabled = true;
    
    // Собираем данные формы
    const formData = new FormData(form);
    const data = {
        email: formData.get('email'),
        fullName: formData.get('fullName'),
        location: formData.get('location'),
        requestedAmount: formData.get('requestedAmount'),
        ownInvestment: formData.get('ownInvestment'),
        assetsDescription: formData.get('assetsDescription'),
        businessIdea: formData.get('businessIdea'),
        competitiveAdvantages: formData.get('competitiveAdvantages'),
        impactDescription: formData.get('impactDescription'),
        purpose: formData.get('purpose'),
        additionalInfo: formData.get('additionalInfo'),
        source_url: window.location.href,
        form: 'general_with_idea',
        price: '3490',
        yandex_client_id: clientId
    };
    
            // Отправляем запрос на API
        fetch('https://app.zakazat-biznesplan.online/create-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                // Пытаемся получить детальную информацию об ошибке
                if (response.status === 400) {
                    throw new Error('Неверные данные формы');
                } else if (response.status === 500) {
                    throw new Error('Ошибка сервера');
                } else {
                    throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
                }
            }
            return response.json();
        })
        .then(result => {
            console.log('Успешно отправлено:', result);
            
            // Проверяем, есть ли URL для подтверждения
            if (result.confirmation_url) {
                // Выполняем редирект на страницу подтверждения
                console.log('Выполняем редирект на:', result.confirmation_url);
                window.location.href = result.confirmation_url;
            } else {
                // Если URL нет, показываем уведомление об успехе
                showNotification('Успешно! Ваша заявка на премиум пакет отправлена. Мы свяжемся с вами в ближайшее время.', 'success');
                form.reset();
            }
        })
    .catch(error => {
        console.error('Ошибка отправки:', error);
        let errorMessage = 'Произошла ошибка при отправке. Попробуйте еще раз или свяжитесь с нами.';
        
        // Пытаемся получить более детальную информацию об ошибке
        if (error.message) {
            errorMessage = `Ошибка: ${error.message}`;
        }
        
        showNotification(errorMessage, 'error');
    })
    .finally(() => {
        // Восстанавливаем кнопку только если не произошел редирект
        if (!window.location.href.includes('confirmation')) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Handle quick question form submission
function handleQuickQuestionSubmission() {
    const form = document.querySelector('.contact-form');
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    // Показываем состояние загрузки
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
    submitBtn.disabled = true;
    
    // Собираем данные формы
    const formData = new FormData(form);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        message: formData.get('message'),
        source_url: window.location.href,
        form: 'quick_question',
        yandex_client_id: clientId
    };
    
    // Отправляем запрос на API
    fetch('https://app.zakazat-biznesplan.online/create-order', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            // Пытаемся получить детальную информацию об ошибке
            if (response.status === 400) {
                throw new Error('Неверные данные формы');
            } else if (response.status === 500) {
                throw new Error('Ошибка сервера');
            } else {
                throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
            }
        }
        return response.json();
    })
    .then(result => {
        console.log('Вопрос отправлен:', result);
        showNotification('Спасибо! Ваш вопрос отправлен. Мы ответим в течение 24 часов.', 'success');
        form.reset();
    })
    .catch(error => {
        console.error('Ошибка отправки:', error);
        let errorMessage = 'Произошла ошибка при отправке. Попробуйте еще раз или свяжитесь с нами.';
        
        // Пытаемся получить более детальную информацию об ошибке
        if (error.message) {
            errorMessage = `Ошибка: ${error.message}`;
        }
        
        showNotification(errorMessage, 'error');
    })
    .finally(() => {
        // Восстанавливаем кнопку
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
}

// Select plan function
function selectPlan(planType) {
    // Scroll to forms section
    const contactSection = document.getElementById('contact');
    if (contactSection) {
        const headerHeight = document.querySelector('.header').offsetHeight;
        const targetPosition = contactSection.offsetTop - headerHeight - 20;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
    
    if (planType === 'basic') {
        showNotification('Выбран базовый пакет (2,690₽)', 'info');
    } else if (planType === 'premium') {
        showNotification('Выбран премиум пакет (3,490₽)', 'info');
    }
}



// Scroll effects
function initScrollEffects() {
    // Parallax effect for hero section
    const hero = document.querySelector('.hero');
    if (hero) {
        window.addEventListener('scroll', function() {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            hero.style.transform = `translateY(${rate}px)`;
        });
    }
    
    // Smooth scroll for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Utility functions
function scrollToForm() {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
        const headerHeight = document.querySelector('.header').offsetHeight;
        const targetPosition = contactSection.offsetTop - headerHeight - 20;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const headerHeight = document.querySelector('.header').offsetHeight;
        const targetPosition = section.offsetTop - headerHeight - 20;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
}

// Initialize animated success stories
function initAnimatedStories() {
    const storiesTrack = document.querySelector('.stories-track');
    const storiesContainer = document.querySelector('.stories-container');
    if (!storiesTrack) return;
    
    const stories = generateSuccessStories(100);
    
    // Создаем бесконечную ленту, дублируя истории
    // Добавляем оригинальные истории
    stories.forEach(story => {
        const storyElement = createStoryElement(story);
        storiesTrack.appendChild(storyElement);
    });
    
    // Добавляем копии для бесконечной прокрутки (нужно минимум 3 полных набора)
    for (let i = 0; i < 3; i++) {
        stories.forEach(story => {
            const storyElement = createStoryElement(story);
            storiesTrack.appendChild(storyElement);
        });
    }
    
    // Показываем истории после небольшой задержки
    setTimeout(() => {
        if (storiesContainer) {
            storiesContainer.classList.add('loaded');
        }
    }, 500);
}

// Создание элемента истории
function createStoryElement(story) {
    const storyElement = document.createElement('div');
    storyElement.className = 'story-card';
    storyElement.innerHTML = `
        <div class="story-avatar">
            <i class="fas fa-user"></i>
        </div>
        <div class="story-content">
            <h4>${story.name}</h4>
            <p>"${story.text}"</p>
            <div class="story-result">
                <span class="result-label">Результат:</span>
                <span class="result-value">${story.result}</span>
            </div>
        </div>
    `;
    return storyElement;
}

// Generate realistic success stories
function generateSuccessStories(count) {
    const names = [
        'Александр', 'Мария', 'Дмитрий', 'Елена', 'Сергей', 'Ольга', 'Андрей', 'Наталья',
        'Владимир', 'Татьяна', 'Игорь', 'Светлана', 'Михаил', 'Анна', 'Павел', 'Юлия',
        'Николай', 'Ирина', 'Алексей', 'Екатерина', 'Роман', 'Марина', 'Артем', 'Алиса',
        'Денис', 'Кристина', 'Максим', 'Виктория', 'Антон', 'Полина', 'Иван', 'Дарья'
    ];
    
    const cities = [
        'Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань', 'Нижний Новгород',
        'Челябинск', 'Самара', 'Уфа', 'Ростов-на-Дону', 'Краснодар', 'Пермь', 'Воронеж',
        'Волгоград', 'Красноярск', 'Саратов', 'Тюмень', 'Тольятти', 'Ижевск', 'Барнаул'
    ];
    
    const storyTexts = [
        'Получил одобрение кредита с первого раза. Бизнес-план был идеальным.',
        'Банк одобрил все документы без вопросов. Рекомендую всем!',
        'План получился детальным и понятным. Спасибо команде!',
        'Получил грант на открытие бизнеса. Все требования учтены.',
        'Бизнес-план помог получить инвестиции. Очень благодарен.',
        'Документы одобрили в банке без замечаний. Отличный сервис!',
        'План получился структурированным и профессиональным.',
        'Бизнес-план соответствует всем стандартам. Быстро и качественно.',
        'Получил одобрение на субсидию. Все требования выполнены.',
        'План помог привлечь инвесторов. Профессиональный подход!',
        'Открыл автосервис по плану. Сейчас доход 150 000₽/мес!',
        'Получила грант на цветочный магазин. Уже вышла на прибыль!',
        'Бизнес-план помог получить соцконтракт. Открыл пекарню!',
        'Банк одобрил кредит без вопросов. План был идеальным!',
        'Получил субсидию на ферму. Все расчеты точные!',
        'Открыл кофейню по плану. Клиенты довольны!',
        'Бизнес-план для инвестора. Получил финансирование!',
        'План для налоговой. Все документы приняли!',
        'Грант на IT-стартап. План помог привлечь внимание!',
        'Кредит на магазин. Банк одобрил с первого раза!'
    ];
    
    const results = [
        '300 000₽ гранта', '150 000₽/мес', '200 000₽ субсидии', '500 000₽ кредита',
        '100 000₽ гранта', '80 000₽/мес', '250 000₽ инвестиций', '120 000₽/мес',
        '400 000₽ соцконтракта', '90 000₽/мес', '180 000₽ гранта', '110 000₽/мес',
        '350 000₽ кредита', '70 000₽/мес', '220 000₽ субсидии', '130 000₽/мес',
        '280 000₽ гранта', '95 000₽/мес', '160 000₽ инвестиций', '140 000₽/мес'
    ];
    
    const stories = [];
    for (let i = 0; i < count; i++) {
        const name = names[Math.floor(Math.random() * names.length)];
        const city = cities[Math.floor(Math.random() * cities.length)];
        const text = storyTexts[Math.floor(Math.random() * storyTexts.length)];
        const result = results[Math.floor(Math.random() * results.length)];
        
        stories.push({
            name: `${name}, ${city}`,
            text: text,
            result: result
        });
    }
    
    return stories;
}



// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 400px;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        hideNotification(notification);
    }, 5000);
    
    // Close button functionality
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', () => {
        hideNotification(notification);
    });
}

function hideNotification(notification) {
    notification.style.transform = 'translateX(400px)';
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

function getNotificationIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

function getNotificationColor(type) {
    const colors = {
        'success': '#10b981',
        'error': '#ef4444',
        'warning': '#f59e0b',
        'info': '#3b82f6'
    };
    return colors[type] || '#3b82f6';
}








