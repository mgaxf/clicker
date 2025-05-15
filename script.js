document.addEventListener('DOMContentLoaded', () => {
    const clickButton = document.getElementById('clickButton');
    const imageContainer = document.getElementById('imageContainer');
    const colorBackground = document.getElementById('colorBackground');
    const clickCounter = document.getElementById('clickCounter');
    const secretContainer = document.getElementById('secretContainer');
    const endgameUpgradeContainer = document.getElementById('endgameUpgradeContainer');
    
    // Элементы для сброса статистики
    const resetButton = document.getElementById('resetButton');
    const resetConfirmContainer = document.getElementById('resetConfirmContainer');
    const cancelResetButton = document.getElementById('cancelResetButton');
    const confirmResetButton = document.getElementById('confirmResetButton');
    
    // Элементы улучшений
    const upgradeClickPowerBtn = document.getElementById('upgradeClickPower');
    const upgradeAutoClickBtn = document.getElementById('upgradeAutoClick');
    const upgradeUltimateBtn = document.getElementById('upgradeUltimate');
    const upgradeEndgameBtn = document.getElementById('upgradeEndgame');
    const clickPowerLevelElem = document.getElementById('clickPowerLevel');
    const autoClickLevelElem = document.getElementById('autoClickLevel');
    const ultimateLevelElem = document.getElementById('ultimateLevel');
    const endgameLevelElem = document.getElementById('endgameLevel');
    const clickPowerCostElem = document.getElementById('clickPowerCost');
    const autoClickCostElem = document.getElementById('autoClickCost');
    const ultimateCostElem = document.getElementById('ultimateCost');
    const endgameCostElem = document.getElementById('endgameCost');
    
    // Объект с данными об улучшениях
    const upgrades = {
        clickPower: {
            level: 0,
            baseCost: 50,
            costMultiplier: 1.5,  // Множитель для увеличения стоимости с каждым уровнем
            value: 1,  // Базовое значение манго за нажатие
            increment: 1  // Сколько добавляется за каждый уровень улучшения
        },
        autoClick: {
            level: 0,
            baseCost: 100,
            costMultiplier: 1.8,
            value: 0,  // Базовое значение манго в секунду
            increment: 5  // Сколько манго в секунду добавляет каждый уровень
        },
        ultimate: {
            purchased: false,
            cost: 5000,
            clickPowerBonus: 100,
            autoClickBonus: 50
        },
        endgame: {
            purchased: false,
            cost: 200000,
            visible: false
        }
    };
    
    // Счетчик манго
    let clickCount = 0;
    
    // Переменные для оптимизации производительности
    let flyingImagesCount = 0;
    const MAX_FLYING_IMAGES = 20; // Максимальное число летающих изображений
    let lastClickTime = 0;
    const CLICK_THROTTLE = 50; // Минимальный интервал между обработками кликов в мс
    let pendingUIUpdate = false; // Флаг для предотвращения слишком частых обновлений UI
    
    // Проверка, есть ли сохраненное значение в localStorage
    function loadFromLocalStorage() {
        if (localStorage.getItem('clickCount')) {
            clickCount = parseInt(localStorage.getItem('clickCount'));
            clickCounter.textContent = clickCount;
        }
        
        if (localStorage.getItem('upgrades')) {
            const savedUpgrades = JSON.parse(localStorage.getItem('upgrades'));
            upgrades.clickPower.level = savedUpgrades.clickPower.level || 0;
            upgrades.autoClick.level = savedUpgrades.autoClick.level || 0;
            upgrades.ultimate.purchased = savedUpgrades.ultimate?.purchased || false;
            upgrades.endgame.purchased = savedUpgrades.endgame?.purchased || false;
            upgrades.endgame.visible = savedUpgrades.endgame?.visible || false;
            
            // Расчет текущих значений на основе уровней
            upgrades.clickPower.value = 1 + (upgrades.clickPower.level * upgrades.clickPower.increment);
            upgrades.autoClick.value = upgrades.autoClick.level * upgrades.autoClick.increment;
            
            // Если ультимативное улучшение куплено, применяем его бонусы
            if (upgrades.ultimate.purchased) {
                upgrades.clickPower.value += upgrades.ultimate.clickPowerBonus;
                upgrades.autoClick.value += upgrades.ultimate.autoClickBonus;
                
                // Показываем эндгейм-апгрейд, если ультимативное куплено
                upgrades.endgame.visible = true;
                endgameUpgradeContainer.style.display = 'flex';
            }
            
            // Если энд-геймовое улучшение куплено, применяем эффекты
            if (upgrades.endgame.purchased) {
                applyEndgameEffects(false); // false, чтобы не показывать секретный экран при загрузке
            }
            
            // Обновляем отображение
            updateUpgradesUI();
        }
    }
    
    // Загружаем данные
    loadFromLocalStorage();
    
    // Оптимизация работы с localStorage - отложенное сохранение
    let saveTimeout = null;
    function saveToLocalStorage() {
        if (saveTimeout) {
            clearTimeout(saveTimeout);
        }
        
        saveTimeout = setTimeout(() => {
            localStorage.setItem('clickCount', clickCount);
            localStorage.setItem('upgrades', JSON.stringify({
                clickPower: { level: upgrades.clickPower.level },
                autoClick: { level: upgrades.autoClick.level },
                ultimate: { purchased: upgrades.ultimate.purchased },
                endgame: { purchased: upgrades.endgame.purchased, visible: upgrades.endgame.visible }
            }));
        }, 1000); // Откладываем сохранение на 1 секунду
    }
    
    // Функция для сброса статистики
    function resetStats() {
        // Очищаем данные из localStorage
        localStorage.removeItem('clickCount');
        localStorage.removeItem('upgrades');
        
        // Сбрасываем счетчик
        clickCount = 0;
        clickCounter.textContent = '0';
        
        // Сбрасываем улучшения
        upgrades.clickPower.level = 0;
        upgrades.clickPower.value = 1;
        upgrades.autoClick.level = 0;
        upgrades.autoClick.value = 0;
        upgrades.ultimate.purchased = false;
        upgrades.endgame.purchased = false;
        upgrades.endgame.visible = false;
        
        // Скрываем элементы энд-гейма
        endgameUpgradeContainer.style.display = 'none';
        
        // Сбрасываем визуальные эффекты
        clickButton.classList.remove('ascended');
        
        // Обновляем интерфейс
        updateUpgradesUI();
        
        // Скрываем окно подтверждения
        resetConfirmContainer.style.display = 'none';
    }
    
    // Обработчики для сброса статистики
    resetButton.addEventListener('click', () => {
        resetConfirmContainer.style.display = 'flex';
    });
    
    cancelResetButton.addEventListener('click', () => {
        resetConfirmContainer.style.display = 'none';
    });
    
    confirmResetButton.addEventListener('click', resetStats);
    
    // Также закрываем окно подтверждения при клике вне блока
    resetConfirmContainer.addEventListener('click', (e) => {
        if (e.target === resetConfirmContainer) {
            resetConfirmContainer.style.display = 'none';
        }
    });
    
    // Функция расчета стоимости улучшения
    function calculateUpgradeCost(baseСost, level, multiplier) {
        return Math.floor(baseСost * Math.pow(multiplier, level));
    }
    
    // Функция обновления интерфейса улучшений
    function updateUpgradesUI() {
        // Обновление информации о силе клика
        const clickPowerCost = calculateUpgradeCost(
            upgrades.clickPower.baseCost, 
            upgrades.clickPower.level, 
            upgrades.clickPower.costMultiplier
        );
        clickPowerLevelElem.textContent = `Ур. ${upgrades.clickPower.level}`;
        clickPowerCostElem.textContent = `${clickPowerCost} манго`;
        
        // Если манго недостаточно, делаем кнопку неактивной
        if (clickCount < clickPowerCost) {
            upgradeClickPowerBtn.classList.add('disabled');
        } else {
            upgradeClickPowerBtn.classList.remove('disabled');
        }
        
        // Обновление информации об автоклике
        const autoClickCost = calculateUpgradeCost(
            upgrades.autoClick.baseCost, 
            upgrades.autoClick.level, 
            upgrades.autoClick.costMultiplier
        );
        autoClickLevelElem.textContent = `Ур. ${upgrades.autoClick.level}`;
        autoClickCostElem.textContent = `${autoClickCost} манго`;
        
        // Если манго недостаточно, делаем кнопку неактивной
        if (clickCount < autoClickCost) {
            upgradeAutoClickBtn.classList.add('disabled');
        } else {
            upgradeAutoClickBtn.classList.remove('disabled');
        }
        
        // Обновление информации об ультимативном улучшении
        if (upgrades.ultimate.purchased) {
            ultimateLevelElem.textContent = `КУПЛЕНО`;
            ultimateCostElem.textContent = `МАКС`;
            upgradeUltimateBtn.classList.add('disabled');
        } else {
            ultimateLevelElem.textContent = `ЗАКРЫТО`;
            ultimateCostElem.textContent = `${upgrades.ultimate.cost} манго`;
            
            if (clickCount < upgrades.ultimate.cost) {
                upgradeUltimateBtn.classList.add('disabled');
            } else {
                upgradeUltimateBtn.classList.remove('disabled');
            }
        }
        
        // Показываем эндгейм-апгрейд, только если ультимативное куплено
        if (upgrades.endgame.visible) {
            endgameUpgradeContainer.style.display = 'flex';
            
            // Обновление информации об энд-геймовом улучшении
            if (upgrades.endgame.purchased) {
                endgameLevelElem.textContent = `ПРОСВЕТЛЕНИЕ`;
                endgameCostElem.textContent = `ДОСТИГНУТО`;
                upgradeEndgameBtn.classList.add('disabled');
            } else {
                endgameLevelElem.textContent = `???`;
                endgameCostElem.textContent = `${upgrades.endgame.cost} манго`;
                
                if (clickCount < upgrades.endgame.cost) {
                    upgradeEndgameBtn.classList.add('disabled');
                } else {
                    upgradeEndgameBtn.classList.remove('disabled');
                }
            }
        } else {
            endgameUpgradeContainer.style.display = 'none';
        }
    }
    
    // Функция для покупки улучшения силы клика
    function upgradeClickPower() {
        const cost = calculateUpgradeCost(
            upgrades.clickPower.baseCost, 
            upgrades.clickPower.level, 
            upgrades.clickPower.costMultiplier
        );
        
        if (clickCount >= cost) {
            // Списываем манго
            clickCount -= cost;
            clickCounter.textContent = clickCount;
            
            // Увеличиваем уровень и силу клика
            upgrades.clickPower.level++;
            upgrades.clickPower.value = 1 + (upgrades.clickPower.level * upgrades.clickPower.increment);
            
            // Если ультимативное улучшение куплено, добавляем его бонус
            if (upgrades.ultimate.purchased) {
                upgrades.clickPower.value += upgrades.ultimate.clickPowerBonus;
            }
            
            // Обновляем интерфейс и сохраняем прогресс
            updateUpgradesUI();
            saveToLocalStorage();
        }
    }
    
    // Функция для покупки улучшения автоклика
    function upgradeAutoClick() {
        const cost = calculateUpgradeCost(
            upgrades.autoClick.baseCost, 
            upgrades.autoClick.level, 
            upgrades.autoClick.costMultiplier
        );
        
        if (clickCount >= cost) {
            // Списываем манго
            clickCount -= cost;
            clickCounter.textContent = clickCount;
            
            // Увеличиваем уровень и скорость автоклика
            upgrades.autoClick.level++;
            upgrades.autoClick.value = upgrades.autoClick.level * upgrades.autoClick.increment;
            
            // Если ультимативное улучшение куплено, добавляем его бонус
            if (upgrades.ultimate.purchased) {
                upgrades.autoClick.value += upgrades.ultimate.autoClickBonus;
            }
            
            // Обновляем интерфейс и сохраняем прогресс
            updateUpgradesUI();
            saveToLocalStorage();
        }
    }
    
    // Функция для покупки ультимативного улучшения
    function upgradeUltimate() {
        if (!upgrades.ultimate.purchased && clickCount >= upgrades.ultimate.cost) {
            // Списываем манго
            clickCount -= upgrades.ultimate.cost;
            clickCounter.textContent = clickCount;
            
            // Помечаем как купленное
            upgrades.ultimate.purchased = true;
            
            // Применяем бонусы
            upgrades.clickPower.value += upgrades.ultimate.clickPowerBonus;
            upgrades.autoClick.value += upgrades.ultimate.autoClickBonus;
            
            // Эффект покупки - много изображений сразу
            for (let i = 0; i < 20; i++) {
                setTimeout(() => {
                    createFlyingImage();
                }, i * 50);
            }
            
            // Показываем энд-геймовое улучшение
            upgrades.endgame.visible = true;
            endgameUpgradeContainer.style.display = 'flex';
            
            // Обновляем интерфейс и сохраняем прогресс
            updateUpgradesUI();
            saveToLocalStorage();
        }
    }
    
    // Функция для покупки энд-геймового улучшения
    function upgradeEndgame() {
        if (!upgrades.endgame.purchased && upgrades.ultimate.purchased && clickCount >= upgrades.endgame.cost) {
            // Списываем манго
            clickCount -= upgrades.endgame.cost;
            clickCounter.textContent = clickCount;
            
            // Помечаем как купленное
            upgrades.endgame.purchased = true;
            
            // Применяем эффекты
            applyEndgameEffects(true);
            
            // Обновляем интерфейс и сохраняем прогресс
            updateUpgradesUI();
            saveToLocalStorage();
        }
    }
    
    // Применение эндгейм эффектов
    function applyEndgameEffects(showSecret = true) {
        // Добавляем класс к кнопке
        clickButton.classList.add('ascended');
        
        // Показываем секретное сообщение только если требуется
        if (showSecret) {
            secretContainer.style.display = 'flex';
            
            // Через 5 секунд скрываем секретное сообщение
            setTimeout(() => {
                secretContainer.style.display = 'none';
            }, 5000);
        }
    }
    
    // Обработчики для кнопок улучшений
    upgradeClickPowerBtn.addEventListener('click', upgradeClickPower);
    upgradeAutoClickBtn.addEventListener('click', upgradeAutoClick);
    upgradeUltimateBtn.addEventListener('click', upgradeUltimate);
    upgradeEndgameBtn.addEventListener('click', upgradeEndgame);
    
    // Автоматическое добавление манго каждую секунду на основе улучшения автоклика
    setInterval(() => {
        if (upgrades.autoClick.value > 0) {
            clickCount += upgrades.autoClick.value;
            clickCounter.textContent = clickCount;
            saveToLocalStorage();
            
            // Обновляем UI улучшений, так как могли появиться доступные покупки
            updateUpgradesUI();
        }
    }, 1000);
    
    // Получение элементов GIF
    const bgGif1 = document.getElementById('bgGif1');
    const bgGif2 = document.getElementById('bgGif2');
    const bgGif3 = document.getElementById('bgGif3');
    
    // Массив всех GIF
    const bgGifs = [bgGif1, bgGif2, bgGif3];
    
    // Проверка загрузки GIF-изображений
    let gifsLoaded = 0;
    let gifsError = 0;
    
    // Обработчик успешной загрузки GIF
    function handleGifLoad() {
        gifsLoaded++;
        
        // Если все GIF загружены успешно, скрываем цветной фон
        if (gifsLoaded === bgGifs.length) {
            if (colorBackground) {
                colorBackground.style.opacity = '0';
            }
            
            // Запускаем автоматическое переключение GIF
            startGifRotation();
        }
    }
    
    // Обработчик ошибки загрузки GIF
    function handleGifError() {
        gifsError++;
        
        // Если хотя бы один GIF не загрузился, показываем цветной фон
        if (gifsError === bgGifs.length) {
            if (colorBackground) {
                colorBackground.style.opacity = '1';
            }
            
            // Скрываем контейнер с GIF
            document.getElementById('gifBackground').style.display = 'none';
        }
    }
    
    // Добавляем обработчики для каждого GIF
    bgGifs.forEach(gif => {
        // Проверяем, загрузился ли уже GIF
        if (gif.complete) {
            handleGifLoad();
        } else {
            gif.addEventListener('load', handleGifLoad);
            gif.addEventListener('error', handleGifError);
        }
    });
    
    // Функция для автоматического переключения GIF - оптимизированная
    function startGifRotation() {
        let currentGifIndex = 0;
        
        // Первый GIF уже активен в HTML
        
        // Функция для переключения на следующий GIF
        function rotateGifs() {
            // Скрываем текущий GIF
            bgGifs[currentGifIndex].classList.remove('active');
            
            // Переходим к следующему GIF
            currentGifIndex = (currentGifIndex + 1) % bgGifs.length;
            
            // Показываем следующий GIF
            bgGifs[currentGifIndex].classList.add('active');
        }
        
        // Запускаем переключение каждые 8 секунд (увеличен интервал для меньшей нагрузки)
        setInterval(rotateGifs, 8000);
    }
    
    // Массив для путей к изображениям
    const imagePaths = [
        'images/image1.png',
        'images/image2.png',
        'images/image3.png'
    ];
    
    // Аудио для воспроизведения
    let audioElement = null;
    
    // Создание элемента аудио для воспроизведения
    function createAudio() {
        audioElement = new Audio();
        audioElement.src = 'sounds/mango.mp3'; // Путь к звуковому файлу
        audioElement.preload = 'auto';
        audioElement.volume = 0.1; // Установка пониженной громкости (10% от максимальной)
    }
    
    createAudio();
    
    // Функция для создания и анимации летящего изображения
    function createFlyingImage() {
        // Ограничиваем количество одновременных анимаций
        if (flyingImagesCount >= MAX_FLYING_IMAGES) {
            return;
        }
        
        flyingImagesCount++;
        
        // Получение случайного пути к изображению из массива
        const randomIndex = Math.floor(Math.random() * imagePaths.length);
        const imagePath = imagePaths[randomIndex];
        
        // Создание элемента изображения
        const img = document.createElement('img');
        img.src = imagePath;
        img.classList.add('flying-image');
        
        // Если куплено энд-геймовое улучшение, добавляем класс для особой анимации
        if (upgrades.endgame.purchased) {
            img.classList.add('enlightened');
        }
        
        // Расчет случайной позиции для появления изображения (относительно кнопки)
        const buttonRect = clickButton.getBoundingClientRect();
        const buttonCenterX = buttonRect.left + buttonRect.width / 2;
        const buttonCenterY = buttonRect.top + buttonRect.height / 2;
        
        // Начальная позиция изображения (у кнопки)
        img.style.left = `${buttonCenterX - 50}px`;
        img.style.top = `${buttonCenterY - 50}px`;
        
        // Добавление изображения на страницу
        imageContainer.appendChild(img);
        
        // Используем requestAnimationFrame для более плавной анимации
        requestAnimationFrame(() => {
            // Случайное направление и расстояние полета
            const angle = Math.random() * Math.PI * 2; // Случайный угол в радианах
            const distance = 300 + Math.random() * 200; // Расстояние полета (300-500px)
            
            const targetX = buttonCenterX + Math.cos(angle) * distance - 50;
            const targetY = buttonCenterY + Math.sin(angle) * distance - 50;
            
            // Применение анимации
            img.style.transition = 'left 1.5s ease-out, top 1.5s ease-out, transform 1.5s ease-out, opacity 1.5s ease-out';
            img.style.left = `${targetX}px`;
            img.style.top = `${targetY}px`;
            
            // Для обычного режима - поворот и масштабирование
            if (!upgrades.endgame.purchased) {
                img.style.transform = 'rotate(' + (Math.random() * 720 - 360) + 'deg) scale(' + (0.5 + Math.random() * 1.5) + ')';
            }
            
            // Удаление изображения после завершения анимации
            setTimeout(() => {
                img.style.opacity = '0';
                setTimeout(() => {
                    if (imageContainer.contains(img)) {
                        imageContainer.removeChild(img);
                    }
                    flyingImagesCount--;
                }, 1000);
            }, 1000);
        });
    }
    
    // Функция для анимации счетчика с использованием requestAnimationFrame
    function animateCounter() {
        const counter = clickCounter;
        let start = null;
        const duration = 200; // Длительность анимации в мс
        
        function animate(timestamp) {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            
            // Вычисляем масштаб от 1 до 1.2 и обратно
            const scale = progress < duration / 2 
                ? 1 + 0.2 * (progress / (duration / 2)) 
                : 1.2 - 0.2 * ((progress - duration / 2) / (duration / 2));
            
            counter.style.transform = `scale(${Math.min(scale, 1.2)})`;
            
            if (progress < duration) {
                requestAnimationFrame(animate);
            } else {
                counter.style.transform = 'scale(1)';
            }
        }
        
        requestAnimationFrame(animate);
    }
    
    // Функция для обновления UI - с предотвращением частых вызовов
    function updateUpgradesUIDebounced() {
        if (!pendingUIUpdate) {
            pendingUIUpdate = true;
            requestAnimationFrame(() => {
                updateUpgradesUI();
                pendingUIUpdate = false;
            });
        }
    }
    
    // Предзагрузка изображений для предотвращения задержек
    function preloadImages() {
        imagePaths.forEach(path => {
            const img = new Image();
            img.src = path;
        });
    }
    
    // Вызываем предзагрузку при загрузке страницы
    preloadImages();
    
    // Обновляем UI улучшений при загрузке страницы
    updateUpgradesUI();
    
    // Обработчик клика на кнопку
    clickButton.addEventListener('click', handleButtonClick);
    
    // Добавление поддержки touch-событий для мобильных устройств
    clickButton.addEventListener('touchstart', function(e) {
        e.preventDefault(); // Предотвращаем стандартное поведение браузера
        clickButton.classList.add('active');
    }, { passive: false });
    
    clickButton.addEventListener('touchend', function(e) {
        e.preventDefault(); // Предотвращаем стандартное поведение браузера
        clickButton.classList.remove('active');
        handleButtonClick();
    }, { passive: false });
    
    // Единая функция обработки клика с троттлингом
    function handleButtonClick() {
        const now = Date.now();
        // Проверяем, прошло ли достаточно времени с последнего клика
        if (now - lastClickTime < CLICK_THROTTLE) {
            return;
        }
        lastClickTime = now;
        
        // Увеличение счетчика (с учетом силы клика)
        clickCount += upgrades.clickPower.value;
        clickCounter.textContent = clickCount;
        
        // Сохранение счетчика в localStorage - ограничиваем частоту
        if (now % 5 === 0) { // Сохраняем каждый 5-й клик
            saveToLocalStorage();
        }
        
        // Анимация счетчика
        animateCounter();
        
        // Воспроизведение звука
        if (audioElement) {
            audioElement.currentTime = 0; // Перемотка в начало
            audioElement.play().catch(error => {
                console.log('Ошибка воспроизведения звука:', error);
            });
        }
        
        // Создание летящего изображения
        createFlyingImage();
        
        // Обновляем UI улучшений
        updateUpgradesUIDebounced();
    }
    
    // Дополнительные обработчики для предотвращения залипания кнопок на мобильных устройствах
    document.addEventListener('touchmove', function(e) {
        if (e.target === clickButton) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Предотвращаем зум при двойном тапе
    document.addEventListener('dblclick', function(e) {
        e.preventDefault();
    }, { passive: false });
    
    // Предотвращаем контекстное меню на мобильных устройствах
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    }, { passive: false });
    
    // Предотвращаем выделение текста при длительном нажатии
    document.addEventListener('selectstart', function(e) {
        e.preventDefault();
        return false;
    }, { passive: false });
    
    // Предотвращаем стандартное поведение при длительном нажатии для iOS
    document.addEventListener('touchstart', function(e) {
        // Если это не кнопка или поле ввода, блокируем длительное нажатие
        if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Блокируем действия с изображениями
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('dragstart', e => e.preventDefault());
        img.addEventListener('contextmenu', e => e.preventDefault());
    });
}); 