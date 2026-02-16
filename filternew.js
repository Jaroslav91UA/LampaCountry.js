(function () {
    'use strict';

    // Реєструємо компонент
    function FilterComponent(object) {
        this.create = function () {
            showFilterMenu();
            return null;
        };
        this.active = function () {};
        this.pause = function () {};
        this.destroy = function () {};
    }

    Lampa.Component.add('ultra_filter', FilterComponent);

    // ПОВНИЙ СПИСОК КРАЇН
    var countries = [
        {name:'США', code:'US'}, {name:'Велика Британія', code:'GB'},
        {name:'Франція', code:'FR'}, {name:'Німеччина', code:'DE'},
        {name:'Італія', code:'IT'}, {name:'Іспанія', code:'ES'},
        {name:'Польща', code:'PL'}, {name:'Україна', code:'UA'},
        {name:'Індія', code:'IN'}, {name:'Китай', code:'CN'},
        {name:'Японія', code:'JP'}, {name:'Південна Корея', code:'KR'},
        {name:'Туреччина', code:'TR'}, {name:'Канада', code:'CA'}
    ];

    function showFilterMenu() {
        var saved = JSON.parse(localStorage.getItem('lampa_ultra_filter_settings') || '{"type":"movie","rating":5,"sort":"popularity.desc","exclude":[]}');

        var items = [
            { title: 'Тип: ' + (saved.type === 'movie' ? 'Фільми' : 'Серіали'), type: 'type' },
            { title: 'Мінімальний рейтинг: ' + saved.rating, type: 'rating' },
            { title: 'Сортування: ' + (saved.sort.indexOf('popularity') > -1 ? 'Популярні' : 'Нові'), type: 'sort' },
            { title: 'Виключити країни (вибрано: ' + saved.exclude.length + ')', type: 'countries' },
            { title: '🚀 ЗАСТОСУВАТИ', type: 'apply', ghost: true }
        ];

        Lampa.Select.show({
            title: 'Налаштування фільтра',
            items: items,
            onSelect: function (item) {
                if (item.type === 'apply') {
                    applyFilter(saved);
                } else if (item.type === 'type') {
                    saved.type = saved.type === 'movie' ? 'tv' : 'movie';
                    save(saved);
                } else if (item.type === 'rating') {
                    var ratings = [];
                    for (var i = 0; i <= 9; i++) ratings.push({title: i.toString(), value: i});
                    Lampa.Select.show({
                        title: 'Рейтинг',
                        items: ratings,
                        onSelect: function(r){ saved.rating = r.value; save(saved); }
                    });
                } else if (item.type === 'sort') {
                    Lampa.Select.show({
                        title: 'Сортування',
                        items: [
                            {title: 'Популярні', value: 'popularity.desc'},
                            {title: 'Нові', value: 'primary_release_date.desc'}
                        ],
                        onSelect: function(s){ saved.sort = s.value; save(saved); }
                    });
                } else if (item.type === 'countries') {
                    selectCountries(saved);
                }
            },
            onBack: function () { Lampa.Controller.toggle('menu'); }
        });
    }

    function selectCountries(saved) {
        var items = countries.map(function(c) {
            return { 
                title: c.name, 
                code: c.code, 
                selected: saved.exclude.indexOf(c.code) > -1 
            };
        });

        Lampa.Select.show({
            title: 'Не показувати ці країни',
            items: items,
            onSelect: function (item) {
                var idx = saved.exclude.indexOf(item.code);
                if (idx > -1) saved.exclude.splice(idx, 1);
                else saved.exclude.push(item.code);
                save(saved);
                selectCountries(saved);
            },
            onBack: function() { showFilterMenu(); }
        });
    }

    function save(saved) {
        localStorage.setItem('lampa_ultra_filter_settings', JSON.stringify(saved));
        showFilterMenu();
    }

    function applyFilter(f) {
        var url = 'https://api.themoviedb.org/3/discover/' + f.type + '?api_key=bbb4d66f5dd6fbc0e42c9ec8dbdaf085&language=uk-UA';
        if (f.rating) url += '&vote_average.gte=' + f.rating;
        if (f.sort) url += '&sort_by=' + f.sort;
        if (f.exclude.length) url += '&without_origin_country=' + f.exclude.join(',');

        Lampa.Activity.push({
            component: 'tmdb',
            url: url,
            title: 'Фільтр',
            page: 1
        });
    }

    function inject() {
        var menu = Lampa.Menu.get();
        if (menu.length > 0 && !menu.find(function(i){ return i.id === 'ultra_filter' })) {
            var item = {
                title: 'Фільтр',
                id: 'ultra_filter',
                icon: '<svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/></svg>'
            };
            
            var index = -1;
            for(var i=0; i < menu.length; i++) {
                // Вставка після Головна (id: 'main' або просто перший елемент) 
                // та перед Стрічка (id: 'feed' або 'full')
                if(menu[i].id === 'feed' || menu[i].id === 'full') {
                    index = i;
                    break;
                }
            }

            if (index > -1) menu.splice(index, 0, item);
            else menu.splice(1, 0, item);

            if (Lampa.Menu.render) Lampa.Menu.render();
        }
    }

    Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') inject();
    });

})();
