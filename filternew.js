(function () {
    'use strict';

    // Компонент фільтру
    function UltraFilter() {
        this.create = function () { showFilterMenu(); return null; };
        this.active = function () {};
        this.pause = function () {};
        this.destroy = function () {};
    }

    Lampa.Component.add('ultra_filter', UltraFilter);

    // Список країн
    const countries = [
        {name:'США', code:'US'}, {name:'Велика Британія', code:'GB'},
        {name:'Франція', code:'FR'}, {name:'Німеччина', code:'DE'},
        {name:'Італія', code:'IT'}, {name:'Іспанія', code:'ES'},
        {name:'Польща', code:'PL'}, {name:'Україна', code:'UA'},
        {name:'Індія', code:'IN'}, {name:'Китай', code:'CN'},
        {name:'Японія', code:'JP'}, {name:'Південна Корея', code:'KR'},
        {name:'Туреччина', code:'TR'}, {name:'Канада', code:'CA'}
    ];

    // Відкрити меню фільтру
    function showFilterMenu() {
        let saved;
        try {
            saved = JSON.parse(localStorage.getItem('lampa_ultra_filter_settings')) || {};
        } catch(e) { saved = {}; }
        saved.type = saved.type || 'movie';
        saved.rating = saved.rating || 5;
        saved.sort = saved.sort || 'popularity.desc';
        saved.exclude = saved.exclude || [];

        const items = [
            { title: 'Тип: ' + (saved.type === 'movie' ? 'Фільми' : 'Серіали'), type: 'type' },
            { title: 'Мінімальний рейтинг: ' + saved.rating, type: 'rating' },
            { title: 'Сортування: ' + (saved.sort.includes('popularity') ? 'Популярні' : 'Нові'), type: 'sort' },
            { title: 'Виключити країни (вибрано: ' + saved.exclude.length + ')', type: 'countries' },
            { title: '🚀 ЗАСТОСУВАТИ', type: 'apply', ghost: true }
        ];

        Lampa.Select.show({
            title: 'Налаштування фільтра',
            items: items,
            onSelect: item => {
                switch(item.type){
                    case 'apply': applyFilter(saved); break;
                    case 'type': saved.type = saved.type === 'movie' ? 'tv' : 'movie'; save(saved); break;
                    case 'rating':
                        const ratings = Array.from({length: 10}, (_, i) => ({title: i.toString(), value: i}));
                        Lampa.Select.show({title:'Рейтинг', items: ratings, onSelect: r=>{ saved.rating=r.value; save(saved); }});
                        break;
                    case 'sort':
                        Lampa.Select.show({
                            title:'Сортування',
                            items: [
                                {title:'Популярні', value:'popularity.desc'},
                                {title:'Нові', value:'primary_release_date.desc'}
                            ],
                            onSelect: s=>{ saved.sort=s.value; save(saved); }
                        });
                        break;
                    case 'countries': selectCountries(saved); break;
                }
            },
            onBack: () => Lampa.Controller.toggle('menu')
        });
    }

    // Вибір країн для виключення
    function selectCountries(saved){
        const items = countries.map(c=>({title:c.name, code:c.code, selected:saved.exclude.includes(c.code)}));
        Lampa.Select.show({
            title:'Не показувати ці країни',
            items: items,
            onSelect: item => {
                const idx = saved.exclude.indexOf(item.code);
                if(idx>-1) saved.exclude.splice(idx,1);
                else saved.exclude.push(item.code);
                save(saved);
                selectCountries(saved);
            },
            onBack: showFilterMenu
        });
    }

    // Зберегти налаштування
    function save(saved){
        localStorage.setItem('lampa_ultra_filter_settings', JSON.stringify(saved));
        showFilterMenu();
    }

    // Застосувати фільтр
    function applyFilter(f){
        let url = `https://api.themoviedb.org/3/discover/${f.type}?api_key=bbb4d66f5dd6fbc0e42c9ec8dbdaf085&language=uk-UA`;
        if(f.rating) url += `&vote_average.gte=${f.rating}`;
        if(f.sort) url += `&sort_by=${f.sort}`;
        if(f.exclude.length) url += `&without_origin_country=${f.exclude.join(',')}`;

        Lampa.Activity.push({component:'tmdb', url:url, title:'Фільтр', page:1});
    }

    // Вставка пункту меню
    function inject(){
        const menu = Lampa.Menu.get();
        if(menu.length && !menu.find(i=>i.id==='ultra_filter')){
            const item = {
                title:'Фільтр',
                id:'ultra_filter',
                icon:'<svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/></svg>'
            };
            let index = menu.findIndex(i=>i.id==='feed' || i.id==='full');
            menu.splice(index>-1 ? index : 1, 0, item);
            if(Lampa.Menu.render) Lampa.Menu.render();
        }
    }

    Lampa.Listener.follow('app', e => { if(e.type==='ready') inject(); });

})();
