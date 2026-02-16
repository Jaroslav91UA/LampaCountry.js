(function () {
    'use strict';

    if (!window.Lampa) return;

    // Реєстрація плагіна в системі
    Lampa.Plugin.add({
        name: 'Country Filter Ultra',
        version: '1.6',
        description: 'Фільтр контенту (інтеграція за прикладом Studios)'
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

    function showFilterMenu() {
        let saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify({
            type: 'movie',
            rating: 5,
            sort: 'popularity.desc',
            exclude: []
        }));

        let items = [
            { title: 'Тип: ' + (saved.type === 'movie' ? 'Фільми' : 'Серіали'), type: 'type' },
            { title: 'Мінімальний рейтинг: ' + saved.rating, type: 'rating' },
            { title: 'Сортування: ' + (saved.sort.includes('popularity') ? 'Популярні' : 'Нові'), type: 'sort' },
            { title: 'Виключити країни (вибрано: ' + saved.exclude.length + ')', type: 'countries' },
            { title: '🚀 ЗАСТОСУВАТИ', type: 'apply', ghost: true }
        ];

        Lampa.Select.show({
            title: 'Налаштування фільтра',
            items: items,
            onSelect: (item) => {
                if (item.type === 'apply') {
                    applyFilter(saved);
                } else if (item.type === 'type') {
                    saved.type = saved.type === 'movie' ? 'tv' : 'movie';
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
                    showFilterMenu();
                } else if (item.type === 'rating') {
                    let ratings = [];
                    for (let i = 0; i <= 9; i++) ratings.push({title: i.toString(), value: i});
                    Lampa.Select.show({
                        title: 'Мінімальний рейтинг',
                        items: ratings,
                        onSelect: (r) => { saved.rating = r.value; localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); showFilterMenu(); }
                    });
                } else if (item.type === 'sort') {
                    Lampa.Select.show({
                        title: 'Сортування',
                        items: [
                            {title: 'Популярні', value: 'popularity.desc'},
                            {title: 'Нові', value: 'primary_release_date.desc'}
                        ],
                        onSelect: (s) => { saved.sort = s.value; localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); showFilterMenu(); }
                    });
                } else if (item.type === 'countries') {
                    selectCountries(saved);
                }
            },
            onBack: () => {
                Lampa.Controller.toggle('menu');
            }
        });
    }

    function selectCountries(saved) {
        let items = countries.map(c => ({ title: c.name, code: c.code, selected: saved.exclude.includes(c.code) }));
        Lampa.Select.show({
            title: 'Не показувати ці країни',
            items: items,
            onSelect: (item) => {
                if (saved.exclude.includes(item.code)) saved.exclude = saved.exclude.filter(i => i !== item.code);
                else saved.exclude.push(item.code);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
                selectCountries(saved);
            },
            onBack: () => showFilterMenu()
        });
    }

    function applyFilter(f) {
        let url = `https://api.themoviedb.org/3/discover/${f.type}?api_key=${API_KEY}&language=uk-UA`;
        if (f.rating) url += `&vote_average.gte=${f.rating}`;
        if (f.sort) url += `&sort_by=${f.sort}`;
        if (f.exclude.length) url += `&without_origin_country=${f.exclude.join(',')}`;

        Lampa.Activity.push({
            component: 'tmdb',
            url: url,
            title: 'Фільтр: ' + (f.type === 'movie' ? 'Фільми' : 'Серіали'),
            page: 1
        });
    }

    // Головна частина: додавання в меню
    function addMenuItem() {
        // Реєструємо компонент, щоб Lampa знала, що запускати при кліку
        Lampa.Component.add('ultra_filter', function () {
            this.create = function () {
                showFilterMenu();
            };
            this.pause = function () {};
            this.active = function () {};
            this.destroy = function () {};
        });

        // Чекаємо на готовність додатка
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') {
                let menu = Lampa.Menu.get();
                let filter_item = {
                    title: 'Фільтр',
                    id: 'ultra_filter',
                    icon: '<svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/></svg>'
                };

                // Знаходимо індекс для вставки (після Головна)
                let index = menu.findIndex(function (i) {
                    return i.id === 'feed' || i.id === 'full';
                });

                if (index > -1) {
                    menu.splice(index, 0, filter_item);
                } else {
                    menu.splice(1, 0, filter_item);
                }

                // Оновлюємо візуальне меню (як у Studios)
                if (Lampa.Menu.render) Lampa.Menu.render();
            }
        });
    }

    addMenuItem();

})();
