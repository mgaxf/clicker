document.addEventListener('DOMContentLoaded', () => {
    const clickButton = document.getElementById('clickButton');
    const imageContainer = document.getElementById('imageContainer');
    const colorBackground = document.getElementById('colorBackground');
    const clickCounter = document.getElementById('clickCounter');
    
    // Счетчик кликов
    let clickCount = 0;
    
    // Проверка, есть ли сохраненное значение в localStorage
    if (localStorage.getItem('clickCount')) {
        clickCount = parseInt(localStorage.getItem('clickCount'));
        clickCounter.textContent = clickCount;
    }
    
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
    
    // Функция для автоматического переключения GIF
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
        
        // Запускаем переключение каждые 5 секунд
        setInterval(rotateGifs, 5000);
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
        // Получение случайного пути к изображению из массива
        const randomIndex = Math.floor(Math.random() * imagePaths.length);
        const imagePath = imagePaths[randomIndex];
        
        // Создание элемента изображения
        const img = document.createElement('img');
        img.src = imagePath;
        img.classList.add('flying-image');
        
        // Расчет случайной позиции для появления изображения (относительно кнопки)
        const buttonRect = clickButton.getBoundingClientRect();
        const buttonCenterX = buttonRect.left + buttonRect.width / 2;
        const buttonCenterY = buttonRect.top + buttonRect.height / 2;
        
        // Начальная позиция изображения (у кнопки)
        img.style.left = `${buttonCenterX - 50}px`;
        img.style.top = `${buttonCenterY - 50}px`;
        
        // Добавление изображения на страницу
        imageContainer.appendChild(img);
        
        // Анимация полета в случайном направлении
        setTimeout(() => {
            // Случайное направление и расстояние полета
            const angle = Math.random() * Math.PI * 2; // Случайный угол в радианах
            const distance = 300 + Math.random() * 200; // Расстояние полета (300-500px)
            
            const targetX = buttonCenterX + Math.cos(angle) * distance - 50;
            const targetY = buttonCenterY + Math.sin(angle) * distance - 50;
            
            // Применение анимации
            img.style.transition = 'left 1.5s ease-out, top 1.5s ease-out, transform 1.5s ease-out, opacity 1.5s ease-out';
            img.style.left = `${targetX}px`;
            img.style.top = `${targetY}px`;
            img.style.transform = 'rotate(' + (Math.random() * 720 - 360) + 'deg) scale(' + (0.5 + Math.random() * 1.5) + ')';
            
            // Удаление изображения после завершения анимации
            setTimeout(() => {
                img.style.opacity = '0';
                setTimeout(() => {
                    imageContainer.removeChild(img);
                }, 1000);
            }, 1000);
        }, 10);
    }
    
    // Функция для анимации счетчика
    function animateCounter() {
        clickCounter.style.transform = 'scale(1.2)';
        setTimeout(() => {
            clickCounter.style.transform = 'scale(1)';
        }, 200);
    }
    
    // Обработчик клика на кнопку
    clickButton.addEventListener('click', () => {
        // Увеличение счетчика
        clickCount++;
        clickCounter.textContent = clickCount;
        
        // Сохранение счетчика в localStorage
        localStorage.setItem('clickCount', clickCount);
        
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
        
        // Эффект нажатия на кнопку
        clickButton.classList.add('active');
        setTimeout(() => {
            clickButton.classList.remove('active');
        }, 100);
    });
}); 