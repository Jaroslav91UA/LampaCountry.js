(function () {
    'use strict';

    if (!window.Lampa) return;

    Lampa.Plugin.add({
        name: 'Country Filter Ultra',
        version: '1.2',
        description: 'Фільтр контенту для TMDB (сумісний з пультом)'
    });

    const API_KEY = 'bbb4d66f5dd6fbc0e42c9ec8dbdaf085';
    const STORAGE_KEY = 'lampa_ultra_filter_settings';

    const countries = [
        {name:'США', code:'US'}, {name:'Велика Британія', code:'GB'},
        {name:'Франція', code:'FR'}, {name:'Німеччина', code:'DE'},
        {name:'Італія', code:'IT'}, {name:'Іспанія', code:'ES'},
        {name:'Польща', code:'PL'}, {name:'Україна', code:'UA'},
        {name:'Індія', code:'IN'}, {name:'Китай', code:'CN'},
        {name:'Японія', code:'JP'}, {name:'Південна Корея', code:'KR'},
        {name:'Туреччина', code:'TR'}, {name:'Канада', code:'CA'}
    ];

    function init() {
        Lampa.Header.addButton({
            icon: '<svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M3 5h18l-7 8v5l-4 2v-7z"/></svg>',
            title: 'Фільтр',
            onSelect: showFilterMenu
        });
    }

    function getSettings() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify({
            type: 'movie',
            rating: 5,
            sort: 'popularity.desc',
            exclude: []
        }));
    }

    function showFilterMenu() {
        let saved = getSettings();

        let items = [
            {
                title: 'Тип: ' + (saved.type === 'movie' ? 'Фільми' : 'Серіали'),
                subtitle: 'Змінити тип контенту',
                type: 'type'
            },
            {
                title: 'Мінімальний рейтинг: ' + saved.rating,
                subtitle: 'Від 0 до 10',
                type: 'rating'
            },
            {
                title: 'Сортування',
                subtitle: 'Зараз: ' + (saved.sort.includes('popularity') ? 'Популярні' : 'Нові'),
                type: 'sort'
            },
            {
                title: 'Виключити країни',
                subtitle: saved.exclude.length ? 'Вибрано: ' + saved.exclude.length : 'Немає виключень',
                type: 'countries'
            },
            {
                title: '🚀 ЗАСТОСУВАТИ',
                type: 'apply',
                ghost: true
            }
        ];

        Lampa.Select.show({
            title: 'Налаштування фільтра',
            items: items,
            onSelect: (item) => {
                if (item.type === 'apply') {
                    applyFilter(saved);
                } else if (item.type === 'type') {
                    saved.type = saved.type === 'movie' ? 'tv' : 'movie';
                    saveAndRefresh(saved);
                } else if (item.type === 'rating') {
                    selectRating(saved);
                } else if (item.type === 'sort') {
                    selectSort(saved);
                } else if (item.type === 'countries') {
                    selectCountries(saved);
                }
            },
            onBack: () => Lampa.Controller.toggle('content')
        });
    }

    function selectRating(saved) {
        let ratings = [];
        for (let i = 0; i <= 9; i++) ratings.push({title: i.toString(), value: i});
        Lampa.Select.show({
            title: 'Мінімальний рейтинг',
            items: ratings,
            onSelect: (item) => {
                saved.rating = item.value;
                saveAndRefresh(saved);
            }
        });
    }

    function selectSort(saved) {
        Lampa.Select.show({
            title: 'Сортування',
            items: [
                {title: 'Популярні', value: 'popularity.desc'},
                {title: 'Нові', value: 'primary_release_date.desc'},
                {title: 'Рейтинг', value: 'vote_average.desc'}
            ],
            onSelect: (item) => {
                saved.sort = item.value;
                saveAndRefresh(saved);
            }
        });
    }

    function selectCountries(saved) {
        let items = countries.map(c => {
            return {
                title: c.name,
                code: c.code,
                selected: saved.exclude.includes(c.code)
            };
        });

        Lampa.Select.show({
            title: 'Не показувати ці країни',
            items: items,
            onSelect: (item) => {
                if (saved.exclude.includes(item.code)) {
                    saved.exclude = saved.exclude.filter(i => i !== item.code);
                } else {
                    saved.exclude.push(item.code);
                }
                selectCountries(saved); // Перевідкриваємо для оновлення чекбоксів
            },
            onBack: () => {
                saveAndRefresh(saved);
            }
        });
    }

    function saveAndRefresh(saved) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
        showFilterMenu(); // Повертаємось у головне меню фільтра
    }

    function applyFilter(f) {
        let url = `https://api.themoviedb.org/3/discover/${f.type}?api_key=${API_KEY}&language=uk-UA`;

        if (f.rating) url += `&vote_average.gte=${f.rating}`;
        if (f.sort) url += `&sort_by=${f.sort}`;
        
        // Використовуємо modern TMDB API параметр для виключення країн
        if (f.exclude && f.exclude.length) {
            url += `&without_origin_country=${f.exclude.join(',')}`;
        }

        Lampa.Activity.push({
            component: 'tmdb',
            url: url,
            title: 'Фільтр: ' + (f.type === 'movie' ? 'Фільми' : 'Серіали'),
            page: 1
        });
    }

    // Запуск плагіна
    if (window.appready) init();
    else Lampa.Listener.follow('app', e => {
        if (e.type === 'ready') init();
    });

})();